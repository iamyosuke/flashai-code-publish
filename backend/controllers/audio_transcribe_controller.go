package controllers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/handlers"
	"gorm.io/gorm"
)

type AudioTranscribeController struct {
	handler *handlers.AudioTranscribeHandler
}

func NewAudioTranscribeController(db *gorm.DB) (*AudioTranscribeController, error) {
	handler, err := handlers.NewAudioTranscribeHandler()
	if err != nil {
		return nil, err
	}

	return &AudioTranscribeController{
		handler: handler,
	}, nil
}

func (c *AudioTranscribeController) RegisterRoutes(router *gin.RouterGroup) {
	log.Println("Registering audio transcribe routes")
	
	// 音声文字起こしエンドポイント
	router.POST("/audio/transcribe", c.handler.TranscribeAudio)
}

// GetTranscribeAudioHandler returns the handler function for external use
func (c *AudioTranscribeController) GetTranscribeAudioHandler() gin.HandlerFunc {
	return c.handler.TranscribeAudio
}
