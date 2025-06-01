package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/test"
	"github.com/stretchr/testify/assert"
)

func TestAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.Default()

	protected := r.Group("/protected")
	protected.Use(AuthMiddleware())
	protected.GET("/", func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Protected route accessed",
			"user_id": userID,
		})
	})

	t.Run("Authenticated request", func(t *testing.T) {
		req, w := test.AuthenticatedRequest("GET", "/protected/", nil, "test_clerk_id")

		ctx := req.Context()
		claims := &clerk.SessionClaims{
			RegisteredClaims: clerk.RegisteredClaims{
				Subject: "dummy_clerk_id",
			},
		}
		ctx = clerk.ContextWithSessionClaims(ctx, claims)
		req = req.WithContext(ctx)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "test_clerk_id", response["user_id"])
	})

	t.Run("Unauthenticated request", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected/", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestWithAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.Default()

	r.GET("/with-auth", AuthMiddleware(), func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Authenticated",
			"user_id": userID,
		})
	})

	t.Run("With Auth Middleware Test", func(t *testing.T) {
		req, w := test.AuthenticatedRequest("GET", "/with-auth", nil, "test_clerk_id")

		ctx := req.Context()
		claims := &clerk.SessionClaims{
			RegisteredClaims: clerk.RegisteredClaims{
				Subject: "test_clerk_id",
			},
		}
		ctx = clerk.ContextWithSessionClaims(ctx, claims)
		req = req.WithContext(ctx)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
	t.Run("With Auth Middleware Test", func(t *testing.T) {
		req, w := test.AuthenticatedRequest("GET", "/with-auth", nil, "dummy_clerk_id")

		ctx := req.Context()
		claims := &clerk.SessionClaims{
			RegisteredClaims: clerk.RegisteredClaims{
				Subject: "test_clerk_id",
			},
		}
		ctx = clerk.ContextWithSessionClaims(ctx, claims)
		req = req.WithContext(ctx)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}
