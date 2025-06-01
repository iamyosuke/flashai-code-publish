package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"gorm.io/gorm"
)

// BaseHandler contains common functionality
type BaseHandler struct {
	db *gorm.DB
}

// getCurrentUser returns the authenticated user or handles the error
func (h *BaseHandler) getCurrentUser(ctx *gin.Context) (*models.User, bool) {
	userIDStr, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return nil, false
	}

	var user models.User
	if err := h.db.Where("clerk_id = ?", userIDStr).First(&user).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return nil, false
	}

	return &user, true
}

// parseIDParam parses an ID parameter from the URL
func parseIDParam(ctx *gin.Context, param string) (uint64, bool) {
	id, err := strconv.ParseUint(ctx.Param(param), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return 0, false
	}
	return id, true
}

// validateOwnership checks if the user owns the deck
func (h *BaseHandler) validateOwnership(deck *models.Deck, userID uint) bool {
	return deck.UserID == userID
}

// handleError handles common error responses
func handleError(ctx *gin.Context, status int, message string) {
	ctx.JSON(status, gin.H{"error": message})
}
