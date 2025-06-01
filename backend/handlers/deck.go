package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/muratayousuke/ai-flashcards/services"
	"gorm.io/gorm"
)

type DeckHandler struct {
	BaseHandler
	statsService *services.StatsService
}

func NewDeckHandler(db *gorm.DB) *DeckHandler {
	return &DeckHandler{
		BaseHandler:  BaseHandler{db: db},
		statsService: services.NewStatsService(db),
	}
}

type createDeckRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}

func (h *DeckHandler) Create(ctx *gin.Context) {
	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var req createDeckRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		handleError(ctx, http.StatusBadRequest, err.Error())
		return
	}

	deck := &models.Deck{
		UserID:      user.ID,
		Title:       req.Title,
		Description: req.Description,
	}

	if err := h.db.Create(deck).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusCreated, deck)
}

func (h *DeckHandler) List(ctx *gin.Context) {
	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var decks []models.Deck
	if err := h.db.Where("user_id = ?", user.ID).Find(&decks).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, decks)
}

func (h *DeckHandler) Get(ctx *gin.Context) {
	deckID, ok := parseIDParam(ctx, "deckId")
	if !ok {
		return
	}

	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var deck models.Deck
	if err := h.db.First(&deck, deckID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Deck not found")
		return
	}

	if !h.validateOwnership(&deck, user.ID) {
		handleError(ctx, http.StatusForbidden, "Access denied")
		return
	}

	ctx.JSON(http.StatusOK, deck)
}

type updateDeckRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func (h *DeckHandler) Update(ctx *gin.Context) {
	deckID, ok := parseIDParam(ctx, "deckId")
	if !ok {
		return
	}

	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var deck models.Deck
	if err := h.db.First(&deck, deckID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Deck not found")
		return
	}

	if !h.validateOwnership(&deck, user.ID) {
		handleError(ctx, http.StatusForbidden, "Access denied")
		return
	}

	var req updateDeckRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		handleError(ctx, http.StatusBadRequest, err.Error())
		return
	}

	if req.Title != "" {
		deck.Title = req.Title
	}
	if req.Description != "" {
		deck.Description = req.Description
	}

	if err := h.db.Save(&deck).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, deck)
}

func (h *DeckHandler) Delete(ctx *gin.Context) {
	deckID, ok := parseIDParam(ctx, "deckId")
	if !ok {
		return
	}

	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var deck models.Deck
	if err := h.db.First(&deck, deckID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Deck not found")
		return
	}

	if !h.validateOwnership(&deck, user.ID) {
		handleError(ctx, http.StatusForbidden, "Access denied")
		return
	}

	if err := h.db.Delete(&deck).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.Status(http.StatusOK)
}

func (h *DeckHandler) GetStats(ctx *gin.Context) {
	deckID, ok := parseIDParam(ctx, "deckId")
	if !ok {
		return
	}

	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	// Verify deck ownership
	var deck models.Deck
	if err := h.db.First(&deck, deckID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Deck not found")
		return
	}

	if !h.validateOwnership(&deck, user.ID) {
		handleError(ctx, http.StatusForbidden, "Access denied")
		return
	}

	// Get deck statistics
	stats, err := h.statsService.GetDeckStats(uint(deckID), user.ID)
	if err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, stats)
}
