import { Card, Deck } from "@/lib/types";

export const mockDecks: Deck[] = [
  {
    id: "1",
    title: "Japanese N5 Vocabulary",
    description: "Basic Japanese vocabulary for JLPT N5",
    userId: "user1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Common Kanji",
    description: "Most frequently used kanji characters",
    userId: "user1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockCards: Record<string, Card[]> = {
  "1": [
    {
      id: "1",
      deckId: "1",
      front: "犬",
      back: "いぬ (dog)",
      status: "new",
      reviewCount: 0,
      lastReview: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      deckId: "1",
      front: "猫",
      back: "ねこ (cat)",
      status: "learning",
      reviewCount: 2,
      lastReview: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  "2": [
    {
      id: "3",
      deckId: "2",
      front: "日",
      back: "ひ / にち (day, sun)",
      status: "mastered",
      reviewCount: 5,
      lastReview: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};
