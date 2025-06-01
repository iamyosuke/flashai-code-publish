package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/muratayousuke/ai-flashcards/test"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func setupCommonTestRouter() (*gin.Engine, *gorm.DB, func()) {
	db, cleanup := test.SetupTestDB()
	r := test.SetupRouter()
	return r, db, cleanup
}

type TestHandler struct {
	BaseHandler
}

func NewTestHandler(db *gorm.DB) *TestHandler {
	return &TestHandler{
		BaseHandler: BaseHandler{db: db},
	}
}

func TestGetCurrentUser(t *testing.T) {
	r, db, cleanup := setupCommonTestRouter()
	defer cleanup()
	
	handler := NewTestHandler(db)
	user := test.CreateTestUser(db)
	
	r.GET("/test/get-current-user", test.MockAuthMiddleware(user.ClerkID), func(c *gin.Context) {
		currentUser, ok := handler.getCurrentUser(c)
		if !ok {
			return // エラーレスポンスはgetCurrentUserで既に設定されています
		}
		
		c.JSON(http.StatusOK, gin.H{
			"user_id": currentUser.ID,
			"clerk_id": currentUser.ClerkID,
			"email": currentUser.Email,
		})
	})
	
	t.Run("ユーザーが認証されている場合", func(t *testing.T) {
		req, w := test.AuthenticatedRequest("GET", "/test/get-current-user", nil, user.ClerkID)
		r.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		assert.Equal(t, float64(user.ID), response["user_id"])
		assert.Equal(t, user.ClerkID, response["clerk_id"])
		assert.Equal(t, user.Email, response["email"])
	})
	
	t.Run("ユーザーが認証されていない場合", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/test/get-current-user", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
	
	t.Run("ユーザーが見つからない場合", func(t *testing.T) {
		req, w := test.AuthenticatedRequest("GET", "/test/get-current-user", nil, "nonexistent_clerk_id")
		r.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestParseIDParam(t *testing.T) {
	r, _, cleanup := setupCommonTestRouter()
	defer cleanup()
	
	r.GET("/test/parse-id/:id", func(c *gin.Context) {
		id, ok := parseIDParam(c, "id")
		if !ok {
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"id": id})
	})
	
	t.Run("正しいID形式の場合", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/test/parse-id/123", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		assert.Equal(t, float64(123), response["id"])
	})
	
	t.Run("不正なID形式の場合", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/test/parse-id/invalid", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestValidateOwnership(t *testing.T) {
	_, db, cleanup := setupCommonTestRouter()
	defer cleanup()
	
	handler := NewTestHandler(db)
	user := test.CreateTestUser(db)
	deck := test.CreateTestDeck(db, user.ID)
	
	t.Run("所有者が一致する場合", func(t *testing.T) {
		result := handler.validateOwnership(deck, user.ID)
		assert.True(t, result)
	})
	
	t.Run("所有者が一致しない場合", func(t *testing.T) {
		result := handler.validateOwnership(deck, user.ID+1) // 別のユーザーID
		assert.False(t, result)
	})
}

func TestHandleError(t *testing.T) {
	r := test.SetupRouter()
	
	r.GET("/test/handle-error", func(c *gin.Context) {
		handleError(c, http.StatusBadRequest, "テストエラーメッセージ")
	})
	
	req, _ := http.NewRequest("GET", "/test/handle-error", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	assert.Equal(t, "テストエラーメッセージ", response["error"])
}
