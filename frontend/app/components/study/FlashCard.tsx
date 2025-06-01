"use client";

import { Card } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({ card, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div className="perspective-1000 w-full max-w-2xl">
      <div
        className={cn(
          "relative w-full h-80 cursor-pointer transition-transform duration-700 transform-style-preserve-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{ transformStyle: "preserve-3d" }}
        onClick={onFlip}
      >
        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="w-full h-full bg-white border-2 border-gray-200 rounded-xl shadow-lg flex items-center justify-center p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <p className="text-2xl font-medium text-gray-800 mb-4">
                {card.front}
              </p>
              <p className="text-sm text-gray-500">
                Click to reveal answer
              </p>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg flex items-center justify-center p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <p className="text-2xl font-medium text-blue-800 mb-4">
                {card.back}
              </p>
              <p className="text-sm text-blue-600">
                How well did you know this?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
