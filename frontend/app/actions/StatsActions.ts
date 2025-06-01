"use server";

import { DeckStats } from "@/lib/types";
import { getHeaders } from "@/lib/getHeaders";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getDeckStatsAction(deckId: string): Promise<DeckStats> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/decks/${deckId}/stats`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch deck stats: ${response.statusText}`);
  }

  return response.json();
}
