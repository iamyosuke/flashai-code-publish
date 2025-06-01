export interface Deck {
  id: string;
  title: string;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  status: "new" | "learning" | "mastered";
  reviewCount: number;
  lastReview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckInput {
  title: string;
  description: string;
}

export interface UpdateDeckInput {
  title?: string;
  description?: string;
}

export interface CreateCardInput {
  front: string;
  back: string;
}

export interface UpdateCardInput {
  front?: string;
  back?: string;
  status?: "new" | "learning" | "review" | "mastered";
  nextReview?: string | null;
}

export interface GenerateCardsInput {
  text: string;
}

export interface DeckStats {
  deckId: number;
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  accuracyRate: number;
  studyStreak: number;
  totalStudyTime: number; // in seconds
  lastStudiedAt: string | null;
  progressPercent: number;
}

export interface AnswerRecord {
  id: string;
  userId: string;
  deckId: string;
  cardId: string;
  isCorrect: boolean;
  studyTime: number; // in seconds
  answerDate: string;
}

export interface RecordAnswerInput {
  isCorrect: boolean;
  studyTime: number; // in seconds
}

export interface StudyCardsResponse {
  cards: Card[];
  stats: DeckStats;
}

export interface CardPreview {
  id: string;
  userId: string;
  deckTitle: string;
  deckDescription: string;
  front: string;
  back: string;
  generationType: "text" | "image" | "audio";
  sessionId: string;
  expiresAt: string;
  originalPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewResponse {
  sessionId: string;
  deckTitle: string;
  deckDescription: string;
  cards: CardPreview[];
  expiresAt: string;
}

export interface ConfirmPreviewInput {
  sessionId: string;
  deckId?: string;
}

export interface RegenerateInput {
  sessionId: string;
  feedback: string;
}
