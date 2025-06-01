package seeds

import (
	"time"

	"github.com/muratayousuke/ai-flashcards/models"
	"gorm.io/gorm"
)

// TestUser テスト用ユーザーのデータ
var TestUser = models.User{
	Email:   "test@test.com",
	Name:    "Test User",
	ClerkID: "user_2xVP20h0vDvDBKHpfJyiuO0k8IX", // このIDはClerkのテストユーザーのIDに置き換える必要があります
}

// SeedAll データベースにシードデータを投入
func SeedAll(db *gorm.DB) error {
	// ユーザーの作成
	if err := db.FirstOrCreate(&TestUser, models.User{ClerkID: TestUser.ClerkID}).Error; err != nil {
		return err
	}

	// テストデッキの作成
	deck := models.Deck{
		UserID:      TestUser.ID,
		Title:       "JLPT N3 Grammar",
		Description: "Essential grammar points for JLPT N3",
	}
	if err := db.FirstOrCreate(&deck, models.Deck{Title: deck.Title, UserID: TestUser.ID}).Error; err != nil {
		return err
	}

	// テストカードの作成（より多くのカードと異なるステータス）
	cards := []models.Card{
		{
			DeckID:      deck.ID,
			Front:       "〜ことにする",
			Back:        "To decide to do ~",
			Hint:        "Used when making a decision",
			Status:      "mastered",
			ReviewCount: 6,
		},
		{
			DeckID:      deck.ID,
			Front:       "〜ようとする",
			Back:        "To try to do ~",
			Hint:        "Used when attempting to do something",
			Status:      "learning",
			ReviewCount: 3,
		},
		{
			DeckID:      deck.ID,
			Front:       "〜ばかり",
			Back:        "Only, just ~",
			Hint:        "Used to express 'only' or 'just'",
			Status:      "mastered",
			ReviewCount: 8,
		},
		{
			DeckID:      deck.ID,
			Front:       "〜わけではない",
			Back:        "It doesn't mean that ~",
			Hint:        "Used to deny or clarify",
			Status:      "learning",
			ReviewCount: 2,
		},
		{
			DeckID: deck.ID,
			Front:  "〜に違いない",
			Back:   "Must be ~, no doubt ~",
			Hint:   "Used to express certainty",
			Status: "new",
		},
		{
			DeckID: deck.ID,
			Front:  "〜とは限らない",
			Back:   "Not necessarily ~",
			Hint:   "Used to express that something is not always the case",
			Status: "new",
		},
	}

	var createdCards []models.Card
	for _, card := range cards {
		var existingCard models.Card
		if err := db.Where("front = ? AND deck_id = ?", card.Front, deck.ID).First(&existingCard).Error; err != nil {
			// カードが存在しない場合は作成
			if err := db.Create(&card).Error; err != nil {
				return err
			}
			createdCards = append(createdCards, card)
		} else {
			// 既存のカードを更新
			existingCard.Status = card.Status
			existingCard.ReviewCount = card.ReviewCount
			if err := db.Save(&existingCard).Error; err != nil {
				return err
			}
			createdCards = append(createdCards, existingCard)
		}
	}

	// 回答記録の作成（統計情報のため）
	now := time.Now()
	answerRecords := []models.AnswerRecord{
		// 昨日の学習記録
		{
			UserID:     TestUser.ID,
			DeckID:     deck.ID,
			CardID:     createdCards[0].ID,
			IsCorrect:  true,
			StudyTime:  30,
			AnswerDate: now.AddDate(0, 0, -1),
		},
		{
			UserID:     TestUser.ID,
			DeckID:     deck.ID,
			CardID:     createdCards[1].ID,
			IsCorrect:  false,
			StudyTime:  45,
			AnswerDate: now.AddDate(0, 0, -1),
		},
		// 今日の学習記録
		{
			UserID:     TestUser.ID,
			DeckID:     deck.ID,
			CardID:     createdCards[0].ID,
			IsCorrect:  true,
			StudyTime:  25,
			AnswerDate: now.Add(-2 * time.Hour),
		},
		{
			UserID:     TestUser.ID,
			DeckID:     deck.ID,
			CardID:     createdCards[2].ID,
			IsCorrect:  true,
			StudyTime:  20,
			AnswerDate: now.Add(-1 * time.Hour),
		},
		{
			UserID:     TestUser.ID,
			DeckID:     deck.ID,
			CardID:     createdCards[3].ID,
			IsCorrect:  true,
			StudyTime:  35,
			AnswerDate: now.Add(-30 * time.Minute),
		},
	}

	for _, record := range answerRecords {
		var existingRecord models.AnswerRecord
		if err := db.Where("user_id = ? AND deck_id = ? AND card_id = ? AND answer_date = ?",
			record.UserID, record.DeckID, record.CardID, record.AnswerDate).First(&existingRecord).Error; err != nil {
			// 記録が存在しない場合は作成
			if err := db.Create(&record).Error; err != nil {
				return err
			}
		}
	}

	return nil
}
