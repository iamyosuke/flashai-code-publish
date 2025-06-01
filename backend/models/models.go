package models

import (
	"time"

	"gorm.io/gorm"
)

type Model struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
}

type User struct {
	Model
	Email         string         `gorm:"uniqueIndex;not null" json:"email"`
	Name          string         `gorm:"not null" json:"name"`
	ClerkID       string         `gorm:"uniqueIndex;not null" json:"clerkId"`
	Subscriptions []Subscription `gorm:"foreignKey:UserID" json:"subscriptions"`
}

type Subscription struct {
	Model
	UserID               uint       `gorm:"not null;index" json:"userId"`
	Email                string     `gorm:"not null;index" json:"email"`
	StripeSubscriptionID string     `gorm:"uniqueIndex;not null" json:"stripeSubscriptionId"`
	StripeCustomerID     string     `gorm:"not null;index" json:"stripeCustomerId"`
	Status               string     `gorm:"not null" json:"status"`   // active, canceled, past_due, unpaid, incomplete, incomplete_expired, trialing
	PlanType             string     `gorm:"not null" json:"planType"` // basic, premium, pro
	CurrentPeriodStart   time.Time  `gorm:"not null" json:"currentPeriodStart"`
	CurrentPeriodEnd     time.Time  `gorm:"not null" json:"currentPeriodEnd"`
	CancelAtPeriodEnd    bool       `gorm:"default:false" json:"cancelAtPeriodEnd"`
	CanceledAt           *time.Time `json:"canceledAt"`
	User                 User       `gorm:"foreignKey:UserID" json:"user"`
}

type Deck struct {
	Model
	UserID      uint   `gorm:"not null" json:"userId"`
	Title       string `gorm:"not null" json:"title"`
	Description string `json:"description"`
}

type Card struct {
	Model
	DeckID         uint       `gorm:"not null" json:"deckId"`
	Front          string     `gorm:"not null" json:"front"`
	Back           string     `gorm:"not null" json:"back"`
	Hint           string     `json:"hint"`
	ReviewCount    int        `gorm:"default:0" json:"reviewCount"`
	LastReview     *time.Time `json:"lastReview"`
	Status         string     `gorm:"default:'new'" json:"status"`            // new, learning, mastered
	GenerationType string     `gorm:"default:'manual'" json:"generationType"` // manual, text, image, audio
}

type AnswerRecord struct {
	Model
	UserID     uint      `gorm:"not null" json:"userId"`
	DeckID     uint      `gorm:"not null" json:"deckId"`
	CardID     uint      `gorm:"not null" json:"cardId"`
	IsCorrect  bool      `json:"isCorrect"`
	StudyTime  int       `json:"studyTime"` // in seconds
	AnswerDate time.Time `json:"answerDate"`
}

type CardPreview struct {
	Model
	UserID          uint      `gorm:"not null" json:"userId"`
	DeckTitle       string    `gorm:"not null" json:"deckTitle"`
	DeckDescription string    `json:"deckDescription"`
	Front           string    `gorm:"not null" json:"front"`
	Back            string    `gorm:"not null" json:"back"`
	GenerationType  string    `gorm:"not null" json:"generationType"`  // text, image, audio
	SessionID       string    `gorm:"not null;index" json:"sessionId"` // プレビューセッション識別用
	ExpiresAt       time.Time `gorm:"not null;index" json:"expiresAt"` // 一定時間後に自動削除
	OriginalPrompt  string    `json:"originalPrompt"`                  // 再生成時のため
}

type DeckStats struct {
	DeckID          uint       `json:"deckId"`
	TotalCards      int        `json:"totalCards"`
	MasteredCards   int        `json:"masteredCards"`
	LearningCards   int        `json:"learningCards"`
	NewCards        int        `json:"newCards"`
	AccuracyRate    float64    `json:"accuracyRate"`
	StudyStreak     int        `json:"studyStreak"`
	TotalStudyTime  int        `json:"totalStudyTime"` // in seconds
	LastStudiedAt   *time.Time `json:"lastStudiedAt"`
	ProgressPercent float64    `json:"progressPercent"`
}
