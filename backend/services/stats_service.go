package services

import (
	"time"

	"github.com/muratayousuke/ai-flashcards/models"
	"gorm.io/gorm"
)

type StatsService struct {
	db *gorm.DB
}

func NewStatsService(db *gorm.DB) *StatsService {
	return &StatsService{db: db}
}

func (s *StatsService) GetDeckStats(deckID uint, userID uint) (*models.DeckStats, error) {
	stats := &models.DeckStats{
		DeckID: deckID,
	}

	// Get total cards count
	var totalCards int64
	if err := s.db.Model(&models.Card{}).Where("deck_id = ?", deckID).Count(&totalCards).Error; err != nil {
		return nil, err
	}
	stats.TotalCards = int(totalCards)

	// Get cards by status
	var masteredCards, learningCards, newCards int64
	s.db.Model(&models.Card{}).Where("deck_id = ? AND status = ?", deckID, "mastered").Count(&masteredCards)
	s.db.Model(&models.Card{}).Where("deck_id = ? AND status = ?", deckID, "learning").Count(&learningCards)
	s.db.Model(&models.Card{}).Where("deck_id = ? AND status = ?", deckID, "new").Count(&newCards)

	stats.MasteredCards = int(masteredCards)
	stats.LearningCards = int(learningCards)
	stats.NewCards = int(newCards)

	// Calculate progress percentage
	if stats.TotalCards > 0 {
		stats.ProgressPercent = float64(stats.MasteredCards) / float64(stats.TotalCards) * 100
	}

	// Get accuracy rate from answer records
	var correctSessions, totalSessions int64
	s.db.Model(&models.AnswerRecord{}).Where("deck_id = ? AND user_id = ?", deckID, userID).Count(&totalSessions)
	s.db.Model(&models.AnswerRecord{}).Where("deck_id = ? AND user_id = ? AND is_correct = ?", deckID, userID, true).Count(&correctSessions)

	if totalSessions > 0 {
		stats.AccuracyRate = float64(correctSessions) / float64(totalSessions) * 100
	}

	// Get total study time
	var totalStudyTime int64
	s.db.Model(&models.AnswerRecord{}).
		Where("deck_id = ? AND user_id = ?", deckID, userID).
		Select("COALESCE(SUM(study_time), 0)").
		Scan(&totalStudyTime)
	stats.TotalStudyTime = int(totalStudyTime)

	// Get last studied date
	var lastRecord models.AnswerRecord
	if err := s.db.Where("deck_id = ? AND user_id = ?", deckID, userID).
		Order("answer_date DESC").
		First(&lastRecord).Error; err == nil {
		stats.LastStudiedAt = &lastRecord.AnswerDate
	}

	// Calculate study streak
	stats.StudyStreak = s.calculateStudyStreak(deckID, userID)

	return stats, nil
}

func (s *StatsService) calculateStudyStreak(deckID uint, userID uint) int {
	// Get distinct study dates in descending order
	var dates []time.Time
	s.db.Model(&models.AnswerRecord{}).
		Where("deck_id = ? AND user_id = ?", deckID, userID).
		Select("DISTINCT DATE(answer_date) as date").
		Order("date DESC").
		Pluck("date", &dates)

	if len(dates) == 0 {
		return 0
	}

	streak := 0
	today := time.Now().Truncate(24 * time.Hour)

	for i, date := range dates {
		expectedDate := today.AddDate(0, 0, -i)
		if date.Truncate(24 * time.Hour).Equal(expectedDate) {
			streak++
		} else {
			break
		}
	}

	return streak
}

func (s *StatsService) RecordAnswerRecord(record *models.AnswerRecord) error {
	// Record the answer record
	if err := s.db.Create(record).Error; err != nil {
		return err
	}

	// Update card status based on performance
	return s.updateCardStatus(record.CardID, record.IsCorrect)
}

func (s *StatsService) updateCardStatus(cardID uint, isCorrect bool) error {
	var card models.Card
	if err := s.db.First(&card, cardID).Error; err != nil {
		return err
	}

	// Update review count and last review time
	card.ReviewCount++
	now := time.Now()
	card.LastReview = &now

	// Update status based on performance and review count
	if isCorrect {
		switch card.Status {
		case "new":
			if card.ReviewCount >= 2 {
				card.Status = "learning"
			}
		case "learning":
			if card.ReviewCount >= 5 {
				card.Status = "mastered"
			}
		}
	} else {
		// If incorrect, move back to learning (unless it's new)
		if card.Status == "mastered" {
			card.Status = "learning"
		}
	}

	return s.db.Save(&card).Error
}
