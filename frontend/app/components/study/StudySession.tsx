"use client";

import { Card } from "@/lib/types";
import { useState } from "react";
import { FlashCard } from "./FlashCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { recordAnswerAction } from "@/app/actions/StudyActions";

interface StudySessionProps {
  deckId: string;
  cards: Card[];
}

export function StudySession({ deckId, cards }: StudySessionProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [studyResults, setStudyResults] = useState<{
    correct: number;
    incorrect: number;
    dontKnow: number;
  }>({
    correct: 0,
    incorrect: 0,
    dontKnow: 0,
  });

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (result: "correct" | "incorrect" | "dontKnow") => {
    // Record learning result
    try {
      await recordAnswerAction(deckId, currentCard.id, {
        isCorrect: result === "correct",
        studyTime: 0,
      });
    } catch (error) {
      console.error("Failed to record learning:", error);
    }

    // Update study results
    setStudyResults(prev => ({
      ...prev,
      [result]: prev[result] + 1,
    }));

    // Move to next card or complete session
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-green-600">Study Complete!</h2>
          <p className="text-lg text-muted-foreground">
            You have completed all {cards.length} cards in this deck.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4 min-w-[300px]">
          <h3 className="text-xl font-semibold text-center">Results</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-600">✅ Correct:</span>
              <span className="font-semibold">{studyResults.correct}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">❌ Incorrect:</span>
              <span className="font-semibold">{studyResults.incorrect}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">❓ Don&apos;t Know:</span>
              <span className="font-semibold">{studyResults.dontKnow}</span>
            </div>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{cards.length}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href={`/decks/${deckId}`}>Back to Deck</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setIsCompleted(false);
              setStudyResults({ correct: 0, incorrect: 0, dontKnow: 0 });
            }}
          >
            Study Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>
            {currentCardIndex + 1} / {cards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flash Card */}
      <div className="flex justify-center">
        <FlashCard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={handleCardFlip}
        />
      </div>

      {/* Answer Buttons */}
      {isFlipped && (
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            onClick={() => handleAnswer("incorrect")}
          >
            ❌ Incorrect
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            onClick={() => handleAnswer("dontKnow")}
          >
            ❓ Don&apos;t Know
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            onClick={() => handleAnswer("correct")}
          >
            ✅ Correct
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!isFlipped && (
        <div className="text-center text-muted-foreground">
          <p>Click the card to reveal the answer</p>
        </div>
      )}
    </div>
  );
}
