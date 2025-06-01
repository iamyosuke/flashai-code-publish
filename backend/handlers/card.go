package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/muratayousuke/ai-flashcards/services"
	"gorm.io/gorm"
)

type CardHandler struct {
	BaseHandler
	statsService *services.StatsService
}

func NewCardHandler(db *gorm.DB) *CardHandler {
	return &CardHandler{
		BaseHandler:  BaseHandler{db: db},
		statsService: services.NewStatsService(db),
	}
}

type createCardRequest struct {
	Front string `json:"front" binding:"required"`
	Back  string `json:"back" binding:"required"`
	Hint  string `json:"hint"`
}

func (h *CardHandler) CreateCard(ctx *gin.Context) {
	deckID, err := strconv.Atoi(ctx.Param("deckId"))
	if err != nil {
		handleError(ctx, http.StatusBadRequest, "Invalid deck ID")
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

	var req createCardRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		handleError(ctx, http.StatusBadRequest, err.Error())
		return
	}

	card := &models.Card{
		DeckID: uint(deckID),
		Front:  req.Front,
		Back:   req.Back,
		Hint:   req.Hint,
	}

	if err := h.db.Create(card).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusCreated, card)
}

func (h *CardHandler) ListCards(ctx *gin.Context) {
	deckID, err := strconv.Atoi(ctx.Param("deckId"))
	if err != nil {
		handleError(ctx, http.StatusBadRequest, "Invalid deck ID")
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

	var cards []models.Card
	if err := h.db.Where("deck_id = ?", deckID).Find(&cards).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, cards)
}

type updateCardRequest struct {
	Front string `json:"front"`
	Back  string `json:"back"`
	Hint  string `json:"hint"`
}

func (h *CardHandler) UpdateCard(ctx *gin.Context) {
	cardID, ok := parseIDParam(ctx, "cardId")
	if !ok {
		return
	}

	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var card models.Card
	if err := h.db.First(&card, cardID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Card not found")
		return
	}

	var deck models.Deck
	if err := h.db.First(&deck, card.DeckID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Deck not found")
		return
	}

	if !h.validateOwnership(&deck, user.ID) {
		handleError(ctx, http.StatusForbidden, "Access denied")
		return
	}

	var req updateCardRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		handleError(ctx, http.StatusBadRequest, err.Error())
		return
	}

	if req.Front != "" {
		card.Front = req.Front
	}
	if req.Back != "" {
		card.Back = req.Back
	}
	if req.Hint != "" {
		card.Hint = req.Hint
	}

	if err := h.db.Save(&card).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, card)
}

type recordAnswerRequest struct {
	IsCorrect bool `json:"isCorrect"`
	StudyTime int  `json:"studyTime"` // in seconds
}

func (h *CardHandler) RecordAnswer(ctx *gin.Context) {
	deckID, err := strconv.Atoi(ctx.Param("deckId"))
	if err != nil {
		handleError(ctx, http.StatusBadRequest, "Invalid deck ID")
		return
	}

	cardID, ok := parseIDParam(ctx, "cardId")
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

	// Verify card belongs to deck
	var card models.Card
	if err := h.db.Where("id = ? AND deck_id = ?", cardID, deckID).First(&card).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Card not found")
		return
	}

	var req recordAnswerRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		handleError(ctx, http.StatusBadRequest, err.Error())
		return
	}

	// Create answer record
	record := &models.AnswerRecord{
		UserID:     user.ID,
		DeckID:     uint(deckID),
		CardID:     uint(cardID),
		IsCorrect:  req.IsCorrect,
		StudyTime:  req.StudyTime,
		AnswerDate: time.Now(),
	}

	// Record the answer and update card status
	if err := h.statsService.RecordAnswerRecord(record); err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.JSON(http.StatusCreated, record)
}

func (h *CardHandler) DeleteCard(ctx *gin.Context) {
	cardID, ok := parseIDParam(ctx, "cardId")
	if !ok {
		return
	}

	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var card models.Card
	if err := h.db.First(&card, cardID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Card not found")
		return
	}

	var deck models.Deck
	if err := h.db.First(&deck, card.DeckID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Deck not found")
		return
	}

	if !h.validateOwnership(&deck, user.ID) {
		handleError(ctx, http.StatusForbidden, "Access denied")
		return
	}

	if err := h.db.Delete(&card).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.Status(http.StatusOK)
}

type recordLearningRequest struct {
	Correct bool `json:"correct"`
}

func (h *CardHandler) RecordLearning(ctx *gin.Context) {
	cardID, ok := parseIDParam(ctx, "cardId")
	if !ok {
		return
	}

	user, ok := h.getCurrentUser(ctx)
	if !ok {
		return
	}

	var card models.Card
	if err := h.db.First(&card, cardID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Card not found")
		return
	}

	var deck models.Deck
	if err := h.db.First(&deck, card.DeckID).Error; err != nil {
		handleError(ctx, http.StatusNotFound, "Deck not found")
		return
	}

	if !h.validateOwnership(&deck, user.ID) {
		handleError(ctx, http.StatusForbidden, "Access denied")
		return
	}

	var req recordLearningRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		handleError(ctx, http.StatusBadRequest, err.Error())
		return
	}

	card.ReviewCount++
	now := time.Now()
	card.LastReview = &now

	if err := h.db.Save(&card).Error; err != nil {
		handleError(ctx, http.StatusInternalServerError, err.Error())
		return
	}

	ctx.Status(http.StatusOK)
}
