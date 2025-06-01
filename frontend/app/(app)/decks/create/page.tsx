import { DeckForm } from "@/app/components/decks/DeckForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Deck - Flash AI",
  description: "Create a new flashcard deck to organize your study materials and enhance your learning experience with Flash AI.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Create New Deck - Flash AI",
    description: "Create a new flashcard deck to organize your study materials and enhance your learning experience with Flash AI.",
  },
};

export default function CreateDeckPage() {
  return <DeckForm mode="create" />;
}
