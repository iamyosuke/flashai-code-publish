package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/handlers"
	"gorm.io/gorm"
)

type AIGenerateController struct {
	handler *handlers.AIGenerateHandler
}

func NewAIGenerateController(db *gorm.DB) (*AIGenerateController, error) {
	handler, err := handlers.NewAIGenerateHandler(db)
	if err != nil {
		return nil, err
	}

	return &AIGenerateController{
		handler: handler,
	}, nil
}

func (c *AIGenerateController) RegisterRoutes(api *gin.RouterGroup) {
	// 統合されたエンドポイント - テキスト、画像、音声すべてを処理
	api.POST("/cards/ai_generate", c.handler.GenerateCards)
	
	// プレビュー機能のエンドポイント
	api.POST("/cards/ai_preview", c.handler.GeneratePreview)
	api.POST("/cards/ai_confirm", c.handler.ConfirmPreview)
	api.POST("/cards/ai_regenerate", c.handler.RegenerateWithFeedback)
}

// GetGenerateCardsHandler returns the handler function for external use
func (c *AIGenerateController) GetGenerateCardsHandler() gin.HandlerFunc {
	return c.handler.GenerateCards
}
