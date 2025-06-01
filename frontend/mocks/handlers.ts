import { http, HttpResponse } from "msw";
import { mockCards, mockDecks } from "./data";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const handlers = [
  // Get all decks
  http.get(`${baseURL}/decks`, () => {
    console.log(`${baseURL}/decks`);
    return HttpResponse.json(mockDecks);
  }),

  // Get a single deck
  http.get(`${baseURL}/decks/:id`, ({ params }) => {
    const deck = mockDecks.find(d => d.id === params.id);
    if (!deck) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(deck);
  }),

  // Get cards for a deck
  http.get(`${baseURL}/decks/:deckId/cards`, ({ params }) => {
    const cards = mockCards[params.deckId as string] || [];
    return HttpResponse.json(cards);
  }),

  // Create a new card
  http.post(`${baseURL}/decks/:deckId/cards`, async ({ params, request }) => {
    const data = (await request.json()) as { front: string; back: string };
    const deckId = params.deckId as string;
    const newCard = {
      id: Math.random().toString(36).substring(7),
      deckId,
      front: data.front,
      back: data.back,
      status: "new" as const,
      reviewCount: 0,
      lastReview: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!mockCards[deckId]) {
      mockCards[deckId] = [];
    }
    mockCards[deckId].push(newCard);
    return HttpResponse.json(newCard);
  }),

  // Update a card
  http.put(
    `${baseURL}/decks/:deckId/cards/:cardId`,
    async ({ params, request }) => {
      const data = (await request.json()) as { front: string; back: string };
      const { deckId, cardId } = params;
      const cards = mockCards[deckId as string];
      const cardIndex = cards?.findIndex(c => c.id === cardId);

      if (!cards || cardIndex === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      const updatedCard = {
        ...cards[cardIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      cards[cardIndex] = updatedCard;

      return HttpResponse.json(updatedCard);
    }
  ),

  // Delete a card
  http.delete(`${baseURL}/decks/:deckId/cards/:cardId`, ({ params }) => {
    const { deckId, cardId } = params;
    const cards = mockCards[deckId as string];
    const cardIndex = cards?.findIndex(c => c.id === cardId);

    if (!cards || cardIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    cards.splice(cardIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Audio transcription mock
  http.post(`${baseURL}/api/audio/transcribe`, async ({ request }) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock transcribed text in Japanese
    const transcribedText = "日本の歴史について学びたいです。特に江戸時代から明治維新にかけての時代について詳しく知りたいです。";
    return HttpResponse.json({ transcribedText });
  }),
];
