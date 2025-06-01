package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// testingInterface は *testing.T と *testing.B の共通インターフェース
type testingInterface interface {
	Errorf(format string, args ...interface{})
}

func setupTestDB(t testingInterface) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Errorf("Failed to open database: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.Subscription{})
	if err != nil {
		t.Errorf("Failed to migrate database: %v", err)
	}

	return db
}

func createTestUser(db *gorm.DB, clerkID string, planType string) {
	user := models.User{
		ClerkID: clerkID,
		Email:   fmt.Sprintf("test-%s@example.com", clerkID),
		Name:    "Test User",
	}
	db.Create(&user)

	if planType != "none" {
		subscription := models.Subscription{
			UserID:               user.ID,
			Email:                user.Email,
			StripeSubscriptionID: fmt.Sprintf("sub_%s", clerkID),
			StripeCustomerID:     fmt.Sprintf("cus_%s", clerkID),
			Status:               "active",
			PlanType:             planType,
			CurrentPeriodStart:   time.Now().Add(-24 * time.Hour),
			CurrentPeriodEnd:     time.Now().Add(24 * time.Hour),
		}
		db.Create(&subscription)
	}
}

func TestRedisRateLimiterMiddleware_GetUserPlanType(t *testing.T) {
	db := setupTestDB(t)

	tests := []struct {
		name     string
		clerkID  string
		planType string
		expected string
	}{
		{"Pro user", "user1", "pro", "pro"},
		{"Premium user", "user2", "premium", "premium"},
		{"Basic user", "user3", "basic", "basic"},
		{"No subscription", "user4", "none", "none"},
		{"Non-existent user", "nonexistent", "", "none"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.clerkID != "nonexistent" {
				createTestUser(db, tt.clerkID, tt.planType)
			}

			result, err := getUserPlanType(db, tt.clerkID)
			if tt.clerkID == "nonexistent" {
				assert.Error(t, err)
			}
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestRedisRateLimiterMiddleware_RateLimits(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)

	tests := []struct {
		name          string
		planType      string
		expectedLimit int
	}{
		{"Pro plan", "pro", 200},
		{"Premium plan", "premium", 50},
		{"Basic plan", "basic", 10},
		{"No subscription", "none", 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userID := fmt.Sprintf("test_%s", tt.planType)
			createTestUser(db, userID, tt.planType)

			r := gin.New()
			r.Use(func(c *gin.Context) {
				c.Set("userID", userID)
				c.Next()
			})
			r.Use(RedisRateLimiterMiddleware(db, "test"))
			r.GET("/test", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "ok"})
			})

			// First request should succeed
			req, _ := http.NewRequest("GET", "/test", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
			assert.Equal(t, fmt.Sprintf("%d", tt.expectedLimit), w.Header().Get("X-RateLimit-Limit"))
		})
	}
}

func TestRedisRateLimiterMiddleware_RateLimitExceeded(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)

	userID := "test_basic"
	createTestUser(db, userID, "basic") // 10 requests per hour

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", userID)
		c.Next()
	})
	r.Use(RedisRateLimiterMiddleware(db, "test"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})

	// Make requests up to the limit
	for i := 0; i < 10; i++ {
		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// Next request should be rate limited
	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Rate limit exceeded", response["error"])
	assert.Equal(t, "basic", response["currentPlan"])
	assert.Contains(t, response["upgradeMessage"], "Upgrade to Premium")
}

func TestRedisRateLimiterMiddleware_UnauthorizedUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)

	r := gin.New()
	r.Use(RedisRateLimiterMiddleware(db, "test"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Authentication required", response["error"])
}

// メモリフォールバックは削除されたため、このテストは不要

func TestGetUpgradeMessage(t *testing.T) {
	tests := []struct {
		plan     string
		expected string
	}{
		{"none", "Consider subscribing to Basic plan for 10 requests/hour, Premium for 50 requests/hour, or Pro for 200 requests/hour"},
		{"basic", "Upgrade to Premium for 50 requests/hour or Pro for 200 requests/hour"},
		{"premium", "Upgrade to Pro for 200 requests/hour"},
		{"pro", ""},
	}

	for _, tt := range tests {
		t.Run(tt.plan, func(t *testing.T) {
			result := getUpgradeMessage(tt.plan)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func BenchmarkRedisRateLimiterMiddleware(b *testing.B) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(b)

	userID := "bench_user"
	createTestUser(db, userID, "pro")

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", userID)
		c.Next()
	})
	r.Use(RedisRateLimiterMiddleware(db, "benchmark"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
	}
}
