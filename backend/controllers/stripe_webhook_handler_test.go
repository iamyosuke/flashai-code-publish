package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stripe/stripe-go/v82"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupStripeHandlerTestDB() *gorm.DB {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	return db
}

func TestStripeWebhookHandler_Handle(t *testing.T) {
	// テスト用のデータベースセットアップ
	db := setupStripeHandlerTestDB()
	handler := NewStripeWebhookHandler(db)

	// Ginのテストモードに設定
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// ルートを登録
	router.POST("/webhook", handler.Handle)

	tests := []struct {
		name           string
		setupEnv       func()
		payload        interface{}
		signature      string
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "Missing webhook secret",
			setupEnv: func() {
				os.Unsetenv("STRIPE_WEBHOOK_SECRET")
			},
			payload:        map[string]interface{}{"type": "customer.subscription.created"},
			signature:      "test-signature",
			expectedStatus: http.StatusInternalServerError,
			expectedBody:   `{"error":"Webhook secret not configured"}`,
		},
		{
			name: "Invalid signature",
			setupEnv: func() {
				os.Setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
			},
			payload:        map[string]interface{}{"type": "customer.subscription.created"},
			signature:      "invalid-signature",
			expectedStatus: http.StatusBadRequest,
			expectedBody:   `{"error":"Invalid signature"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 環境変数のセットアップ
			tt.setupEnv()

			// リクエストボディの作成
			payloadBytes, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/webhook", bytes.NewBuffer(payloadBytes))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Stripe-Signature", tt.signature)

			// レスポンスレコーダーの作成
			w := httptest.NewRecorder()

			// リクエストの実行
			router.ServeHTTP(w, req)

			// アサーション
			assert.Equal(t, tt.expectedStatus, w.Code)
			assert.JSONEq(t, tt.expectedBody, w.Body.String())
		})
	}
}

func TestStripeWebhookHandler_handleSubscriptionCreated(t *testing.T) {
	db := setupStripeHandlerTestDB()
	handler := NewStripeWebhookHandler(db)

	// テスト用のSubscriptionイベント
	subscription := stripe.Subscription{
		ID:     "sub_test_123",
		Status: stripe.SubscriptionStatusActive,
		Customer: &stripe.Customer{
			ID: "cus_test_123",
		},
	}

	subscriptionBytes, _ := json.Marshal(subscription)
	event := stripe.Event{
		Type: "customer.subscription.created",
		Data: &stripe.EventData{
			Raw: subscriptionBytes,
		},
	}

	// メソッドの実行
	err := handler.handleSubscriptionCreated(event)

	// アサーション（Stripeカスタマー取得でエラーが期待される）
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to get customer from Stripe")
}

func TestStripeWebhookHandler_handleSubscriptionDeleted(t *testing.T) {
	db := setupStripeHandlerTestDB()
	handler := NewStripeWebhookHandler(db)

	// テスト用のSubscriptionイベント
	subscription := stripe.Subscription{
		ID:     "sub_test_456",
		Status: stripe.SubscriptionStatusCanceled,
		Customer: &stripe.Customer{
			ID: "cus_test_456",
		},
	}

	subscriptionBytes, _ := json.Marshal(subscription)
	event := stripe.Event{
		Type: "customer.subscription.deleted",
		Data: &stripe.EventData{
			Raw: subscriptionBytes,
		},
	}

	// メソッドの実行
	err := handler.handleSubscriptionDeleted(event)

	// アサーション
	assert.NoError(t, err)
}

func TestWebhookController_HandleWebhook_Stripe(t *testing.T) {
	// テスト用のデータベースセットアップ
	db := setupStripeHandlerTestDB()
	controller := NewWebhookController(db)

	// Ginのテストモードに設定
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// ルートを登録
	router.POST("/webhook/:provider", controller.HandleWebhook)

	// 環境変数のセットアップ
	os.Setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")

	// リクエストボディの作成
	payload := map[string]interface{}{"type": "customer.subscription.created"}
	payloadBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/webhook/stripe", bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Stripe-Signature", "invalid-signature")

	// レスポンスレコーダーの作成
	w := httptest.NewRecorder()

	// リクエストの実行
	router.ServeHTTP(w, req)

	// アサーション（署名が無効なので400エラーが期待される）
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
