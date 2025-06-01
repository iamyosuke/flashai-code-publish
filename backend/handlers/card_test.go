package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/test"
	"github.com/stretchr/testify/assert"
)

func setupCardTestRouter() (*gin.Engine, *CardHandler, func()) {
	db, cleanup := test.SetupTestDB()
	
	user := test.CreateTestUser(db)
	test.CreateTestDeck(db, user.ID)
	
	handler := NewCardHandler(db)
	
	r := test.SetupRouter()
	
	api := r.Group("/api")
	api.Use(test.MockAuthMiddleware(user.ClerkID))
	
	api.POST("/decks/:deckId/cards", handler.CreateCard)
	api.GET("/decks/:deckId/cards", handler.ListCards)
	api.PUT("/cards/:id", handler.UpdateCard)
	api.DELETE("/cards/:id", handler.DeleteCard)
	api.POST("/cards/:id/learning", handler.RecordLearning)
	
	return r, handler, cleanup
}

func TestCreateCard(t *testing.T) {
	r, _, cleanup := setupCardTestRouter()
	defer cleanup()
	
	reqBody := map[string]interface{}{
		"front": "Test Card Front",
		"back": "Test Card Back",
		"hint": "Test Card Hint",
	}
	
	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/decks/1/cards", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	t.Logf("Create card response: %v", response)
}

func TestListCards(t *testing.T) {
	r, handler, cleanup := setupCardTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	test.CreateTestCard(db, 1)
	
	req, _ := http.NewRequest("GET", "/api/decks/1/cards", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response []map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	t.Logf("List cards response: %v", response)
}

func TestUpdateCard(t *testing.T) {
	r, handler, cleanup := setupCardTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	card := test.CreateTestCard(db, 1)
	
	reqBody := map[string]interface{}{
		"front": "Updated Front",
		"back": "Updated Back",
	}
	
	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/cards/%d", card.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var updatedCard struct {
		ID    uint
		Front string
		Back  string
	}
	db.Table("cards").Where("id = ?", card.ID).First(&updatedCard)
	
	assert.Equal(t, "Updated Front", updatedCard.Front)
	assert.Equal(t, "Updated Back", updatedCard.Back)
}

func TestDeleteCard(t *testing.T) {
	r, handler, cleanup := setupCardTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	card := test.CreateTestCard(db, 1)
	
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/cards/%d", card.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	t.Logf("Delete card response: %v", w.Body.String())
	
	var count int64
	db.Table("cards").Where("id = ?", card.ID).Count(&count)
	t.Logf("Cards with ID %d remaining: %d", card.ID, count)
}

func TestRecordLearning(t *testing.T) {
	r, handler, cleanup := setupCardTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	card := test.CreateTestCard(db, 1)
	
	reqBody := map[string]interface{}{
		"correct": true,
	}
	
	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", fmt.Sprintf("/api/cards/%d/learning", card.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var updatedCard struct {
		ID          uint
		ReviewCount int
	}
	db.Table("cards").Where("id = ?", card.ID).First(&updatedCard)
	
	assert.Equal(t, 1, updatedCard.ReviewCount)
}
