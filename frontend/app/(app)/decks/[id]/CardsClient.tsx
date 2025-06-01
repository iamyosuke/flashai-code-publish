"use client";

import { Card } from "@/lib/types";
import { useTransition } from "react";
import { InlineCardForm } from "@/app/components/decks/InlineCardForm";
import { Button } from "@/components/ui/button";
import { CardsList } from "@/app/components/decks/CardsList";
import {
  createCardAction,
  updateCardAction,
  deleteCardAction,
} from "@/app/actions/CardActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface CardsClientProps {
  deckId: string;
  initialCards: Card[];
}

export function CardsClient({ deckId, initialCards }: CardsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleInlineCardSave = async (data: {
    front: string;
    back: string;
  }) => {
    await createCardAction(deckId, data);
    router.refresh();
  };

  const handleEditSave = async (
    cardId: string,
    data: { front: string; back: string }
  ) => {
    try {
      await updateCardAction(cardId, data);
      toast.success("Card updated successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update card");
      console.error("Failed to save card:", error);
    }
  };

  const handleDelete = async (cardId: string) => {
    startTransition(() => {
      deleteCardAction(cardId)
        .then(() => {
          toast.success("Card deleted successfully!");
          router.refresh();
        })
        .catch(error => {
          toast.error("Failed to delete card");
          console.error("Failed to delete card:", error);
        });
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-2">Flashcards</h2>
          <p className="text-gray-600">
            {initialCards.length} cards • Study, edit, or add new cards to your
            deck
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/cards/create/ai?deckId=${deckId}`}>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-xl"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI Generate
            </Button>
          </Link>
          <Link href={`/decks/${deckId}/study`}>
            <Button
              variant="modern"
            >
              Study Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-effect rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {initialCards.length}
          </div>
          <div className="text-sm text-gray-600">Total Cards</div>
        </div>
        <div className="glass-effect rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {initialCards.filter(card => card.status === "mastered").length}
          </div>
          <div className="text-sm text-gray-600">Mastered</div>
        </div>
        <div className="glass-effect rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {initialCards.filter(card => card.status === "learning").length}
          </div>
          <div className="text-sm text-gray-600">Learning</div>
        </div>
        <div className="glass-effect rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {initialCards.filter(card => card.status === "new").length}
          </div>
          <div className="text-sm text-gray-600">New</div>
        </div>
      </div>

      {/* Inline Card Form */}
      <InlineCardForm onSave={handleInlineCardSave} />

      {/* Cards List */}
      {initialCards.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">All Cards</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                />
              </svg>
              <span>Sort by: Recent</span>
            </div>
          </div>

          <div className="glass-effect rounded-2xl overflow-hidden">
            <CardsList
              cards={initialCards}
              onEdit={handleEditSave}
              onDelete={handleDelete}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center floating-animation mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="space-y-2 mb-6">
            <h3 className="text-2xl font-bold text-gray-800">No cards yet</h3>
            <p className="text-gray-600 max-w-md">
              Start building your deck by adding flashcards using the form
              above, or use AI to generate them automatically.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Generate with AI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
