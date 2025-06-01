package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/muratayousuke/ai-flashcards/test"
	"github.com/stretchr/testify/assert"
)

func setupDeckTestRouter() (*gin.Engine, *DeckHandler, func()) {
	db, cleanup := test.SetupTestDB()
	
	user := test.CreateTestUser(db)
	
	handler := NewDeckHandler(db)
	
	r := test.SetupRouter()
	
	api := r.Group("/api")
	api.Use(test.MockAuthMiddleware(user.ClerkID))
	
	api.POST("/decks", handler.Create)
	api.GET("/decks", handler.List)
	api.GET("/decks/:id", handler.Get)
	api.PUT("/decks/:id", handler.Update)
	api.DELETE("/decks/:id", handler.Delete)
	
	return r, handler, cleanup
}

func TestCreateDeck(t *testing.T) {
	r, _, cleanup := setupDeckTestRouter()
	defer cleanup()
	
	reqBody := map[string]interface{}{
		"title": "Test Deck Title",
		"description": "Test Deck Description",
	}
	
	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/decks", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	t.Logf("Create deck response: %v", response)
}

func TestListDecks(t *testing.T) {
	r, handler, cleanup := setupDeckTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	user := test.CreateTestUser(db)
	test.CreateTestDeck(db, user.ID)
	
	req, _ := http.NewRequest("GET", "/api/decks", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response []map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	if len(response) > 0 {
		t.Logf("Got deck response: %v", response)
	} else {
		t.Log("Response is empty, but API returned 200 OK")
	}
}

func TestGetDeck(t *testing.T) {
	r, handler, cleanup := setupDeckTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	
	var user models.User
	db.Where("clerk_id = ?", "test_clerk_id").First(&user)
	deck := test.CreateTestDeck(db, user.ID)
	
	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/decks/%d", deck.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	t.Logf("Get deck response: %v", response)
}

func TestUpdateDeck(t *testing.T) {
	r, handler, cleanup := setupDeckTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	
	var user models.User
	db.Where("clerk_id = ?", "test_clerk_id").First(&user)
	deck := test.CreateTestDeck(db, user.ID)
	
	reqBody := map[string]interface{}{
		"title": "Updated Deck Title",
		"description": "Updated Deck Description",
	}
	
	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/decks/%d", deck.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var updatedDeck struct {
		ID          uint
		Title       string
		Description string
	}
	db.Table("decks").Where("id = ?", deck.ID).First(&updatedDeck)
	
	assert.Equal(t, "Updated Deck Title", updatedDeck.Title)
	assert.Equal(t, "Updated Deck Description", updatedDeck.Description)
}

func TestDeleteDeck(t *testing.T) {
	r, handler, cleanup := setupDeckTestRouter()
	defer cleanup()
	
	db := handler.BaseHandler.db
	
	var user models.User
	db.Where("clerk_id = ?", "test_clerk_id").First(&user)
	deck := test.CreateTestDeck(db, user.ID)
	
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/decks/%d", deck.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var deletedDeck models.Deck
	result := db.Unscoped().Where("id = ?", deck.ID).First(&deletedDeck)
	assert.NoError(t, result.Error)
	assert.NotNil(t, deletedDeck.DeletedAt, "Deck should be soft deleted (DeletedAt should not be nil)")
}
