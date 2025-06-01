package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	r := gin.Default()
	r.Use(CORSMiddleware())
	
	r.GET("/test-cors", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})
	
	t.Run("Normal GET request", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/test-cors", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Headers"), "Content-Type")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "POST")
	})
	
	t.Run("OPTIONS request", func(t *testing.T) {
		req, _ := http.NewRequest("OPTIONS", "/test-cors", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusNoContent, w.Code)
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Headers"), "Content-Type")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "POST")
	})
}
