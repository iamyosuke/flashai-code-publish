package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/test"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func setupTestRouter() (*gin.Engine, *gorm.DB, func()) {
	db, cleanup := test.SetupTestDB()
	r := test.SetupRouter()
	
	r.GET("/health", func(c *gin.Context) {
		sqlDB, err := db.DB()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"message": "データベース接続エラー",
				"error": err.Error(),
			})
			return
		}
		
		if err := sqlDB.Ping(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"message": "データベースPingエラー",
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"version": "1.0.1",
			"database": "connected",
			"environment": gin.Mode(),
		})
	})
	
	r.GET("/public", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "This is a public route",
		})
	})
	
	private := r.Group("/private")
	private.Use(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
		
		test.MockAuthMiddleware("test_clerk_id")(c)
	})
	{
		private.GET("/profile", func(c *gin.Context) {
			claims, _ := c.Get("clerk_claims")
			sessionClaims := claims.(*clerk.SessionClaims)
			
			c.JSON(http.StatusOK, gin.H{
				"message": "This is a protected route",
				"user_id": sessionClaims.RegisteredClaims.Subject,
			})
		})
	}
	
	return r, db, cleanup
}

func TestHealthCheckEndpoint(t *testing.T) {
	r, _, cleanup := setupTestRouter()
	defer cleanup()
	
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	expectedBody := gin.H{
		"status": "ok",
		"version": "1.0.1",
		"database": "connected",
	}
	test.AssertJSONResponse(t, w, http.StatusOK, expectedBody)
}

func TestPublicEndpoint(t *testing.T) {
	r, _, cleanup := setupTestRouter()
	defer cleanup()
	
	req, _ := http.NewRequest("GET", "/public", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	expectedBody := gin.H{
		"message": "This is a public route",
	}
	test.AssertJSONResponse(t, w, http.StatusOK, expectedBody)
}

func TestPrivateEndpoint(t *testing.T) {
	r, _, cleanup := setupTestRouter()
	defer cleanup()
	
	req, w := test.AuthenticatedRequest("GET", "/private/profile", nil, "test_clerk_id")
	r.ServeHTTP(w, req)
	
	expectedBody := gin.H{
		"message": "This is a protected route",
		"user_id": "test_clerk_id",
	}
	test.AssertJSONResponse(t, w, http.StatusOK, expectedBody)
}

func TestPrivateEndpointUnauthorized(t *testing.T) {
	r, _, cleanup := setupTestRouter()
	defer cleanup()
	
	req, _ := http.NewRequest("GET", "/private/profile", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
