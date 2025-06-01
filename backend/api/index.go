package handler

import (
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/muratayousuke/ai-flashcards/controllers"
	"github.com/muratayousuke/ai-flashcards/middleware"
	"github.com/muratayousuke/ai-flashcards/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	router *gin.Engine
	once   sync.Once
)

func init() {
	// 環境変数の読み込み
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
	
	// Gin を production モードに設定
	gin.SetMode(gin.ReleaseMode)
}

func setupRouter() *gin.Engine {
	// データベース接続
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate
	if err := db.AutoMigrate(&models.User{}, &models.Deck{}, &models.Card{}, &models.AnswerRecord{}, &models.Subscription{}, &models.CardPreview{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	// コントローラーの初期化
	deckController := controllers.NewDeckController(db)
	cardController := controllers.NewCardController(db)
	webhookController := controllers.NewWebhookController(db)

	// AI生成コントローラーの初期化
	aiGenerateController, err := controllers.NewAIGenerateController(db)
	if err != nil {
		log.Fatal("Failed to initialize AI generate controller:", err)
	}

	// 音声転写コントローラーの初期化
	audioTranscribeController, err := controllers.NewAudioTranscribeController(db)
	if err != nil {
		log.Fatal("Failed to initialize audio transcribe controller:", err)
	}

	// 認証が必要なAPIルート
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())

	deckController.RegisterRoutes(api)
	cardController.RegisterRoutes(api)
	aiGenerateController.RegisterRoutes(api)
	audioTranscribeController.RegisterRoutes(api)

	// Webhookルーティング（認証なし）
	webhookApi := r.Group("/api")
	webhookApi.POST("/webhook/:provider", webhookController.HandleWebhook)

	// ヘルスチェック
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	return r
}

func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() {
		router = setupRouter()
	})
	
	router.ServeHTTP(w, r)
}
