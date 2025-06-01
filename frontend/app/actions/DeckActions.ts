"use server";

import { getHeaders } from "@/lib/getHeaders";
import { Deck } from "@/lib/types";

const baseURL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api";

export async function getDecksAction(): Promise<Deck[]> {
  const headers = await getHeaders();
  const res = await fetch(`${baseURL}/decks`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch decks");
  }

  return res.json();
}

export async function getDeckAction(id: string): Promise<Deck> {
  const headers = await getHeaders();
  const res = await fetch(`${baseURL}/decks/${id}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch deck");
  }

  return res.json();
}

export async function createDeckAction(data: {
  title: string;
  description: string;
}): Promise<Deck> {
  const res = await fetch(`${baseURL}/decks`, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create deck");
  }

  return res.json();
}

export async function updateDeckAction(
  id: string,
  data: { title: string; description: string }
): Promise<Deck> {
  const res = await fetch(`${baseURL}/decks/${id}`, {
    method: "PUT",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update deck");
  }

  return res.json();
}

export async function deleteDeckAction(id: string): Promise<void> {
  const res = await fetch(`${baseURL}/decks/${id}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to delete deck");
  }
}
