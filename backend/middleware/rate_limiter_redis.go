package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/muratayousuke/ai-flashcards/services"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// 時間あたりの制限値
var hourlyRateLimits = map[string]int{
	"pro":     200, // 200 requests per hour
	"premium": 50,  // 50 requests per hour
	"basic":   10,  // 10 requests per hour
	"none":    5,   // 5 requests per hour for non-subscribers
}

// 月間の制限値（無料ユーザーのみ制限あり）
var monthlyRateLimits = map[string]int{
	"pro":     0,  // 無制限（0は無制限を意味する）
	"premium": 0,  // 無制限
	"basic":   0,  // 無制限
	"none":    50, // 月50リクエストまで
}

// RedisRateLimiterMiddleware creates a Redis-based rate limiting middleware
func RedisRateLimiterMiddleware(db *gorm.DB, endpoint string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		userIDStr := fmt.Sprintf("%v", userID)

		// Get user's subscription plan
		planType, err := getUserPlanType(db, userIDStr)
		if err != nil {
			log.Printf("Error getting user plan: %v", err)
			planType = "none" // Default to no subscription
		}

		// 月間制限のチェック（無料ユーザーのみ）
		monthlyLimit := monthlyRateLimits[planType]
		if monthlyLimit > 0 {
			allowed, remaining, resetTime, err := checkMonthlyLimit(userIDStr, endpoint, monthlyLimit)
			if err != nil {
				log.Printf("Monthly limit check error: %v", err)
				// エラー時はリクエストを許可（安全側に倒す）
			} else {
				// 月間制限ヘッダー
				c.Header("X-RateLimit-Monthly-Limit", strconv.Itoa(monthlyLimit))
				c.Header("X-RateLimit-Monthly-Remaining", strconv.Itoa(remaining))
				c.Header("X-RateLimit-Monthly-Reset", strconv.FormatInt(resetTime, 10))

				if !allowed {
					c.JSON(http.StatusTooManyRequests, gin.H{
						"error":          "Monthly rate limit exceeded",
						"message":        fmt.Sprintf("You have exceeded the monthly limit of %d requests for free tier", monthlyLimit),
						"retryAfter":     resetTime - time.Now().Unix(),
						"currentPlan":    planType,
						"upgradeMessage": "Upgrade to a paid plan for unlimited monthly usage",
					})
					c.Abort()
					return
				}
			}
		}

		// 時間制限のチェック（全ユーザー）
		hourlyLimit, exists := hourlyRateLimits[planType]
		if !exists {
			hourlyLimit = hourlyRateLimits["none"]
		}

		allowed, remaining, resetTime, err := checkHourlyLimit(userIDStr, endpoint, hourlyLimit)
		if err != nil {
			log.Printf("Hourly limit check error: %v", err)
			// エラー時はリクエストを許可（安全側に倒す）
			c.Next()
			return
		}

		// 時間制限ヘッダー
		c.Header("X-RateLimit-Hourly-Limit", strconv.Itoa(hourlyLimit))
		c.Header("X-RateLimit-Hourly-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Hourly-Reset", strconv.FormatInt(resetTime, 10))

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":          "Hourly rate limit exceeded",
				"message":        fmt.Sprintf("You have exceeded the hourly limit of %d requests for %s plan", hourlyLimit, planType),
				"retryAfter":     resetTime - time.Now().Unix(),
				"currentPlan":    planType,
				"upgradeMessage": getUpgradeMessage(planType),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getUserPlanType retrieves the user's current subscription plan from database
func getUserPlanType(db *gorm.DB, userID string) (string, error) {
	var user models.User
	err := db.Preload("Subscriptions").Where("clerk_id = ?", userID).First(&user).Error
	if err != nil {
		return "none", err
	}

	// Find active subscription
	for _, sub := range user.Subscriptions {
		if sub.Status == "active" && time.Now().Before(sub.CurrentPeriodEnd) {
			return sub.PlanType, nil
		}
	}

	return "none", nil
}

// checkHourlyLimit checks if user can make a request (hourly limit)
func checkHourlyLimit(userID, endpoint string, limit int) (allowed bool, remaining int, resetTime int64, err error) {
	if !services.IsRedisAvailable() {
		return false, 0, 0, fmt.Errorf("Redis is not available")
	}
	return checkRedisHourlyLimit(userID, endpoint, limit)
}

// checkRedisHourlyLimit uses Redis sorted sets for precise sliding window rate limiting (hourly)
func checkRedisHourlyLimit(userID, endpoint string, limit int) (allowed bool, remaining int, resetTime int64, err error) {
	ctx := context.Background()
	key := fmt.Sprintf("rate_limit:v1:%s:%s:1h", userID, endpoint)
	now := time.Now()
	windowStart := now.Add(-time.Hour).Unix()
	windowEnd := now.Unix()

	pipe := services.RedisClient.TxPipeline()

	// Remove expired entries
	pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(windowStart, 10))

	// Count current requests in window
	countCmd := pipe.ZCard(ctx, key)

	// Add current request timestamp
	pipe.ZAdd(ctx, key, redis.Z{
		Score:  float64(windowEnd),
		Member: fmt.Sprintf("%d-%d", windowEnd, now.UnixNano()),
	})

	// Set expiry for cleanup
	pipe.Expire(ctx, key, 2*time.Hour)

	_, err = pipe.Exec(ctx)
	if err != nil {
		return false, 0, 0, err
	}

	currentCount := int(countCmd.Val())
	allowed = currentCount < limit
	remaining = limit - currentCount - 1
	if remaining < 0 {
		remaining = 0
	}

	// Calculate reset time (next hour boundary)
	nextHour := time.Date(now.Year(), now.Month(), now.Day(), now.Hour()+1, 0, 0, 0, now.Location())
	resetTime = nextHour.Unix()

	if !allowed {
		// Remove the request we just added since it's not allowed
		pipe = services.RedisClient.TxPipeline()
		pipe.ZRemRangeByScore(ctx, key, strconv.FormatInt(windowEnd, 10), strconv.FormatInt(windowEnd, 10))
		pipe.Exec(ctx)
	}

	return allowed, remaining, resetTime, nil
}

// checkMonthlyLimit checks if user can make a request (monthly limit)
func checkMonthlyLimit(userID, endpoint string, limit int) (allowed bool, remaining int, resetTime int64, err error) {
	if !services.IsRedisAvailable() {
		return false, 0, 0, fmt.Errorf("Redis is not available")
	}
	return checkRedisMonthlyLimit(userID, endpoint, limit)
}

// checkRedisMonthlyLimit uses Redis for monthly rate limiting
func checkRedisMonthlyLimit(userID, endpoint string, limit int) (allowed bool, remaining int, resetTime int64, err error) {
	ctx := context.Background()
	now := time.Now()
	currentMonth := now.Format("2006-01") // YYYY-MM形式

	key := fmt.Sprintf("rate_limit:monthly:v1:%s:%s:%s", userID, endpoint, currentMonth)

	pipe := services.RedisClient.TxPipeline()

	// 現在の使用回数を取得
	countCmd := pipe.Get(ctx, key)

	// キーが存在しない場合は作成し、カウントを1に設定
	pipe.SetNX(ctx, key, "1", getMonthEndDuration(now))

	// キーが存在する場合はインクリメント
	pipe.Incr(ctx, key)

	_, err = pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return false, 0, 0, err
	}

	// カウント値を取得（キーが存在しない場合は0）
	var count int64
	if countCmd.Err() == redis.Nil {
		count = 0
	} else if countCmd.Err() != nil {
		return false, 0, 0, countCmd.Err()
	} else {
		count, _ = countCmd.Int64()
	}

	allowed = count < int64(limit)
	remaining = limit - int(count) - 1
	if remaining < 0 {
		remaining = 0
	}

	// 月末のUnixタイムスタンプを計算
	nextMonth := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
	resetTime = nextMonth.Unix()

	if !allowed {
		// 制限超過の場合、インクリメントを取り消す（最後のIncr操作を元に戻す）
		services.RedisClient.Decr(ctx, key)
	}

	return allowed, remaining, resetTime, nil
}

// 月末までの残り時間を計算
func getMonthEndDuration(now time.Time) time.Duration {
	nextMonth := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
	return nextMonth.Sub(now)
}

// getUpgradeMessage returns a message suggesting plan upgrade
func getUpgradeMessage(currentPlan string) string {
	switch currentPlan {
	case "none":
		return "Consider subscribing to Basic plan for 10 requests/hour, Premium for 50 requests/hour, or Pro for 200 requests/hour"
	case "basic":
		return "Upgrade to Premium for 50 requests/hour or Pro for 200 requests/hour"
	case "premium":
		return "Upgrade to Pro for 200 requests/hour"
	default:
		return ""
	}
}
