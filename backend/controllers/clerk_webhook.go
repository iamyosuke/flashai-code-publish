package controllers

import (
	"bytes"
	"io"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	svix "github.com/svix/svix-webhooks/go"
	"gorm.io/gorm"
)

type ClerkWebhookHandler struct {
	db *gorm.DB
}

func NewClerkWebhookHandler(db *gorm.DB) *ClerkWebhookHandler {
	return &ClerkWebhookHandler{db: db}
}

func (h *ClerkWebhookHandler) Handle(ctx *gin.Context) {
	// Webhookのシークレットを取得
	webhookSecret := os.Getenv("CLERK_WEBHOOK_SECRET")
	if webhookSecret == "" {
		ctx.JSON(500, gin.H{"error": "Webhook secret not configured"})
		return
	}

	// リクエストボディを読み込む
	payload, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.JSON(400, gin.H{"error": "Failed to read request body"})
		return
	}

	// Webhookを検証
	wh, err := svix.NewWebhook(webhookSecret)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to initialize webhook verifier"})
		return
	}

	err = wh.Verify(payload, ctx.Request.Header)
	if err != nil {
		ctx.JSON(400, gin.H{"error": "Invalid webhook signature"})
		return
	}

	// 検証が成功したら、ボディを再設定
	ctx.Request.Body = io.NopCloser(bytes.NewBuffer(payload))

	var event struct {
		Type string `json:"type"`
		Data struct {
			ID             string `json:"id"`
			EmailAddresses []struct {
				EmailAddress string `json:"email_address"`
			} `json:"email_addresses"`
			FirstName string `json:"first_name"`
		} `json:"data"`
	}

	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if event.Type == "user.created" {
		// メールアドレスがない場合はスキップ
		if len(event.Data.EmailAddresses) == 0 {
			ctx.JSON(400, gin.H{"error": "No email address provided"})
			return
		}

		user := models.User{
			Email:   event.Data.EmailAddresses[0].EmailAddress,
			Name:    event.Data.FirstName,
			ClerkID: event.Data.ID,
		}

		if err := h.db.Create(&user).Error; err != nil {
			ctx.JSON(500, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(200, gin.H{"message": "User created successfully"})
		return
	}

	ctx.JSON(200, gin.H{"message": "Event processed"})
}
