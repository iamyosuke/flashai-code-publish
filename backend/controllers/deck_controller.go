package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/handlers"
	"gorm.io/gorm"
)

type DeckController struct {
	handler *handlers.DeckHandler
}

func NewDeckController(db *gorm.DB) *DeckController {
	return &DeckController{
		handler: handlers.NewDeckHandler(db),
	}
}

func (c *DeckController) RegisterRoutes(api *gin.RouterGroup) {
	api.POST("/decks", c.handler.Create)
	api.GET("/decks", c.handler.List)
	api.GET("/decks/:deckId", c.handler.Get)
	api.PUT("/decks/:deckId", c.handler.Update)
	api.DELETE("/decks/:deckId", c.handler.Delete)
	api.GET("/decks/:deckId/stats", c.handler.GetStats)
}
