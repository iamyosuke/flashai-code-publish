"use server";

import { StudyCardsResponse, RecordAnswerInput, AnswerRecord } from "@/lib/types";
import { getHeaders } from "@/lib/getHeaders";

const baseURL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api";

export async function recordAnswerAction(
  deckId: string,
  cardId: string,
  answerData: RecordAnswerInput
): Promise<AnswerRecord> {
  const headers = await getHeaders();
  
  const response = await fetch(`${baseURL}/decks/${deckId}/cards/${cardId}/answer`, {
    method: "POST",
    headers,
    body: JSON.stringify(answerData),
  });

  if (!response.ok) {
    throw new Error(`Failed to record answer: ${response.statusText}`);
  }

  return response.json();
}
