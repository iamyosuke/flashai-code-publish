package middleware

import (
	"log"
	"net/http"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/gin-gonic/gin"
)

func init() {
	// Clerk SDKの初期化
	clerkKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkKey == "" {
		log.Fatal("CLERK_SECRET_KEY is not set")
	}
	clerk.SetKey(clerkKey)
}

// AuthMiddleware Clerkセッションからユーザー情報を取得
func clerkAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := clerk.SessionClaimsFromContext(c.Request.Context())
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Invalid or missing authentication",
			})
			return
		}

		// ユーザー情報をコンテキストに保存
		c.Set("userID", claims.Subject)
		c.Set("claims", claims)
		c.Next()
	}
}

// WithAuth ClerkのHTTPミドルウェアとGinを統合
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Clerkのミドルウェアを使用してトークンを検証
		wrapped := clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 更新されたリクエストをGinコンテキストに設定
			c.Request = r
			// 認証ミドルウェアを実行
			clerkAuthMiddleware()(c)
		}))
		wrapped.ServeHTTP(c.Writer, c.Request)
	}
}
