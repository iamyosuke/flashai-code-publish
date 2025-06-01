package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/handlers"
	"gorm.io/gorm"
)

type CardController struct {
	handler *handlers.CardHandler
}

func NewCardController(db *gorm.DB) *CardController {
	return &CardController{
		handler: handlers.NewCardHandler(db),
	}
}

func (c *CardController) RegisterRoutes(api *gin.RouterGroup) {
	api.POST("/decks/:deckId/cards", c.handler.CreateCard)
	api.GET("/decks/:deckId/cards", c.handler.ListCards)
	api.PUT("/cards/:cardId", c.handler.UpdateCard)
	api.DELETE("/cards/:cardId", c.handler.DeleteCard)
	api.POST("/cards/:cardId/learning", c.handler.RecordLearning)
	api.POST("/decks/:deckId/cards/:cardId/answer", c.handler.RecordAnswer)
}
