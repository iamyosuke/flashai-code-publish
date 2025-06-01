package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/muratayousuke/ai-flashcards/models"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/customer"
	"github.com/stripe/stripe-go/v82/webhook"
	"gorm.io/gorm"
)

type StripeWebhookHandler struct {
	db *gorm.DB
}

func NewStripeWebhookHandler(db *gorm.DB) *StripeWebhookHandler {
	// Stripe APIキーを設定
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	return &StripeWebhookHandler{
		db: db,
	}
}

func (h *StripeWebhookHandler) Handle(ctx *gin.Context) {
	const MaxBodyBytes = int64(65536)
	ctx.Request.Body = http.MaxBytesReader(ctx.Writer, ctx.Request.Body, MaxBodyBytes)

	payload, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		ctx.JSON(http.StatusServiceUnavailable, gin.H{"error": "Service unavailable"})
		return
	}

	// Webhook署名の検証
	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if endpointSecret == "" {
		log.Printf("Warning: STRIPE_WEBHOOK_SECRET not set")
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Webhook secret not configured"})
		return
	}

	signatureHeader := ctx.GetHeader("Stripe-Signature")
	event, err := webhook.ConstructEvent(payload, signatureHeader, endpointSecret)
	if err != nil {
		log.Printf("⚠️  Webhook signature verification failed: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	// イベントタイプに応じて処理を分岐
	switch event.Type {
	case "customer.subscription.created":
		err = h.handleSubscriptionCreated(event)
	case "customer.subscription.deleted":
		err = h.handleSubscriptionDeleted(event)
	default:
		log.Printf("Unhandled event type: %s", event.Type)
	}

	if err != nil {
		log.Printf("Error handling webhook event %s: %v", event.Type, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"received": true})
}

// サブスクリプション作成時の処理
func (h *StripeWebhookHandler) handleSubscriptionCreated(event stripe.Event) error {
	var subscription stripe.Subscription
	err := json.Unmarshal(event.Data.Raw, &subscription)
	if err != nil {
		return fmt.Errorf("error parsing webhook JSON: %v", err)
	}

	log.Printf("🆕 Subscription created: %s", subscription.ID)

	// StripeカスタマーIDからカスタマー情報を取得
	customerID := subscription.Customer.ID
	stripeCustomer, err := customer.Get(customerID, nil)
	if err != nil {
		return fmt.Errorf("failed to get customer from Stripe: %v", err)
	}

	// カスタマーのメールアドレスからユーザーを特定
	var user models.User
	err = h.db.Where("email = ?", stripeCustomer.Email).First(&user).Error
	if err != nil {
		return fmt.Errorf("failed to find user with email %s: %v", stripeCustomer.Email, err)
	}

	// プランタイプを決定（価格IDから判定）
	planType := h.determinePlanType(subscription)

	// 期間情報を取得（subscription itemsから）
	var currentPeriodStart, currentPeriodEnd time.Time
	if len(subscription.Items.Data) > 0 {
		item := subscription.Items.Data[0]
		currentPeriodStart = time.Unix(item.CurrentPeriodStart, 0)
		currentPeriodEnd = time.Unix(item.CurrentPeriodEnd, 0)
	} else {
		// フォールバック: 現在時刻を使用
		now := time.Now()
		currentPeriodStart = now
		currentPeriodEnd = now.AddDate(0, 1, 0) // デフォルトで1ヶ月後
	}

	// サブスクリプションレコードを作成
	subscriptionRecord := models.Subscription{
		UserID:               user.ID,
		Email:                stripeCustomer.Email,
		StripeSubscriptionID: subscription.ID,
		StripeCustomerID:     subscription.Customer.ID,
		Status:               string(subscription.Status),
		PlanType:             planType,
		CurrentPeriodStart:   currentPeriodStart,
		CurrentPeriodEnd:     currentPeriodEnd,
		CancelAtPeriodEnd:    subscription.CancelAtPeriodEnd,
	}

	err = h.db.Create(&subscriptionRecord).Error
	if err != nil {
		return fmt.Errorf("failed to create subscription record: %v", err)
	}

	log.Printf("✅ Created subscription record for user %d (%s), plan %s", user.ID, stripeCustomer.Email, planType)
	return nil
}

// サブスクリプション削除時の処理
func (h *StripeWebhookHandler) handleSubscriptionDeleted(event stripe.Event) error {
	var subscription stripe.Subscription
	err := json.Unmarshal(event.Data.Raw, &subscription)
	if err != nil {
		return fmt.Errorf("error parsing webhook JSON: %v", err)
	}

	log.Printf("🗑️ Subscription deleted: %s", subscription.ID)

	// サブスクリプションレコードを削除（論理削除）
	err = h.db.Where("stripe_subscription_id = ?", subscription.ID).Delete(&models.Subscription{}).Error
	if err != nil {
		return fmt.Errorf("failed to delete subscription record: %v", err)
	}

	log.Printf("✅ Deleted subscription record for subscription %s", subscription.ID)
	return nil
}

// プランタイプを決定する（価格IDやメタデータから判定）
func (h *StripeWebhookHandler) determinePlanType(subscription stripe.Subscription) string {
	// サブスクリプションのアイテムから価格IDを取得
	if len(subscription.Items.Data) > 0 {
		priceID := subscription.Items.Data[0].Price.ID

		// 価格IDに基づいてプランタイプを決定
		// 実際の価格IDに合わせて調整してください
		switch priceID {
		case "price_basic":
			return "basic"
		case "price_premium":
			return "premium"
		case "price_pro":
			return "pro"
		default:
			// メタデータからプランタイプを取得
			if planType, exists := subscription.Metadata["plan_type"]; exists {
				return planType
			}
			return "basic" // デフォルト
		}
	}

	return "basic" // デフォルト
}
