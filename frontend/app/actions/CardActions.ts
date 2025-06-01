"use server";

import { Card, Deck } from "@/lib/types";
import { getHeaders } from "@/lib/getHeaders";
import { createDeckAction } from "./DeckActions";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getCardsForDeckAction(deckId: string): Promise<Card[]> {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/decks/${deckId}/cards`, {
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch cards for deck: ${response.status} ${errorText}`);
  }

  const text = await response.text();
  if (!text) {
    return [];
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse response:", text);
    throw new Error("Invalid JSON response from server");
  }
}

export async function createCardAction(deckId: string, data: { front: string; back: string }): Promise<Card> {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/decks/${deckId}/cards`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create card: ${response.status} ${errorText}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error("Empty response from server");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse response:", text);
    throw new Error("Invalid JSON response from server");
  }
}

export async function updateCardAction(cardId: string, data: { front: string; back: string }): Promise<Card> {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update card: ${response.status} ${errorText}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error("Empty response from server");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse response:", text);
    throw new Error("Invalid JSON response from server");
  }
}

export async function deleteCardAction(cardId: string): Promise<void> {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete card: ${response.status} ${errorText}`);
  }

  // DELETE requests typically don't return content, so we don't try to parse JSON
}

export async function recordLearningAction(cardId: string, data: { difficulty: number; quality: number }): Promise<void> {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}/learning`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to record learning: ${response.status} ${errorText}`);
  }

  // This endpoint might not return content, so we check before parsing
  const text = await response.text();
  if (text) {
    try {
      JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse response:", text);
      // Don't throw here since the operation might have succeeded
    }
  }
}


