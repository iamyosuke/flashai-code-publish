package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func SetupTestDB() (*gorm.DB, func()) {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to test database")
	}

	db.AutoMigrate(&models.User{}, &models.Deck{}, &models.Card{})

	cleanup := func() {
		sqlDB, _ := db.DB()
		sqlDB.Close()
	}

	return db, cleanup
}

func SetupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.Default()
}

func CreateTestUser(db *gorm.DB) *models.User {
	user := &models.User{
		ClerkID: "test_clerk_id",
		Email:   "test@example.com",
		Name:    "Test User",
	}
	db.Create(user)
	return user
}

func CreateTestDeck(db *gorm.DB, userID uint) *models.Deck {
	deck := &models.Deck{
		UserID:      userID,
		Title:       "Test Deck",
		Description: "Test Description",
	}
	db.Create(deck)
	return deck
}

func CreateTestCard(db *gorm.DB, deckID uint) *models.Card {
	card := &models.Card{
		DeckID: deckID,
		Front:  "Test Front",
		Back:   "Test Back",
		Hint:   "Test Hint",
	}
	db.Create(card)
	return card
}

func AuthenticatedRequest(method, url string, body interface{}, clerkID string) (*http.Request, *httptest.ResponseRecorder) {
	var reqBody []byte
	if body != nil {
		reqBody, _ = json.Marshal(body)
	}
	
	req, _ := http.NewRequest(method, url, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer test_token")
	
	w := httptest.NewRecorder()
	return req, w
}

func MockAuthMiddleware(clerkID string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := &clerk.SessionClaims{
			RegisteredClaims: clerk.RegisteredClaims{
				Subject: clerkID,
			},
		}
		c.Set("clerk_claims", claims)
		c.Set("userID", clerkID)
		c.Next()
	}
}

func AssertJSONResponse(t *testing.T, w *httptest.ResponseRecorder, expectedStatus int, expectedBody interface{}) {
	assert.Equal(t, expectedStatus, w.Code)
	
	if expectedBody != nil {
		var actual, expected map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &actual)
		expectedJSON, _ := json.Marshal(expectedBody)
		json.Unmarshal(expectedJSON, &expected)
		
		for k, v := range expected {
			assert.Contains(t, actual, k)
			assert.Equal(t, v, actual[k])
		}
	}
}

func ParseJSONResponse(body []byte, target interface{}) error {
	return json.Unmarshal(body, target)
}
