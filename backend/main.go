package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/muratayousuke/ai-flashcards/controllers"
	"github.com/muratayousuke/ai-flashcards/middleware"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/muratayousuke/ai-flashcards/seeds"
	"github.com/muratayousuke/ai-flashcards/services"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ビルド時に設定される変数
var (
	Version       = "dev"
	GitCommit     = "unknown"
	BuildTime     = "unknown"
	CommitMessage = "unknown"
)

func main() {
	// コマンドラインフラグの定義
	seed := flag.Bool("seed", false, "シードデータを投入する")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Initialize Redis
	services.InitRedis()
	defer services.CloseRedis()

	// Auto migrate
	if err := db.AutoMigrate(&models.User{}, &models.Deck{}, &models.Card{}, &models.AnswerRecord{}, &models.Subscription{}, &models.CardPreview{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// シードデータの投入
	if *seed || gin.Mode() != gin.ReleaseMode {
		if err := seeds.SeedAll(db); err != nil {
			log.Fatal("Failed to seed database:", err)
		}
		log.Println("Successfully seeded database")
		if *seed {
			return
		}
	}

	r := gin.Default()

	// ファイルアップロード制限を設定（50MB）
	r.MaxMultipartMemory = 50 << 20 // 50MB

	r.Use(middleware.CORSMiddleware())

	// ヘルスチェックエンドポイント
	r.GET("/health", func(c *gin.Context) {
		// 環境変数からデプロイメント情報を取得
		deploymentVersion := os.Getenv("DEPLOYMENT_VERSION")
		if deploymentVersion == "" {
			deploymentVersion = Version
		}

		gitCommit := os.Getenv("GIT_COMMIT")
		if gitCommit == "" {
			gitCommit = GitCommit
		}

		buildTime := os.Getenv("BUILD_TIME")
		if buildTime == "" {
			buildTime = BuildTime
		}

		commitMessage := os.Getenv("COMMIT_MESSAGE")
		if commitMessage == "" {
			commitMessage = CommitMessage
		}

		c.JSON(200, gin.H{
			"status":        "ok",
			"version":       deploymentVersion,
			"gitCommit":     gitCommit,
			"commitMessage": commitMessage,
			"buildTime":     buildTime,
			"timestamp":     time.Now().UTC().Format(time.RFC3339),
			"database":      "connected",
			"service":       "ai-flashcards-backend",
		})
	})

	deckController := controllers.NewDeckController(db)
	cardController := controllers.NewCardController(db)
	webhookController := controllers.NewWebhookController(db)

	// AI生成コントローラーの初期化
	aiGenerateController, err := controllers.NewAIGenerateController(db)
	if err != nil {
		log.Fatal("Failed to initialize AI generate controller:", err)
	}

	// 音声文字起こしコントローラーの初期化
	audioTranscribeController, err := controllers.NewAudioTranscribeController(db)
	if err != nil {
		log.Fatal("Failed to initialize audio transcribe controller:", err)
	}

	fmt.Println("WebhookController initialized")
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())

	deckController.RegisterRoutes(api)
	cardController.RegisterRoutes(api)

	// Webhookルーティング（認証なし）
	webhookApi := r.Group("/api")
	webhookApi.POST("/webhook/:provider", webhookController.HandleWebhook)

	// AI生成ルーティング（レート制限付き）
	aiGroup := api.Group("/cards")
	aiGroup.Use(middleware.RedisRateLimiterMiddleware(db, "ai_generate"))
	aiGroup.POST("/ai_generate", aiGenerateController.GetGenerateCardsHandler())

	// 音声文字起こしルーティング（レート制限付き）
	audioGroup := api.Group("/audio")
	audioGroup.Use(middleware.RedisRateLimiterMiddleware(db, "audio_transcribe"))
	audioGroup.POST("/transcribe", audioTranscribeController.GetTranscribeAudioHandler())

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
