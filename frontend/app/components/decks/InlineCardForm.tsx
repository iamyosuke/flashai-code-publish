"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface InlineCardFormProps {
  onSave: (data: { front: string; back: string }) => Promise<void>;
}

export function InlineCardForm({ onSave }: InlineCardFormProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!front.trim() || !back.trim()) {
      toast.error("Both front and back sides are required");
      return;
    }

    startTransition(async () => {
      try {
        await onSave({ front: front.trim(), back: back.trim() });
        setFront("");
        setBack("");
        toast.success("Card added successfully!");
      } catch (error) {
        toast.error("Failed to add card. Please try again.");
        console.error("Failed to save card:", error);
      }
    });
  };

  return (
    <Card className="p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Add New Card</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="inline-front" className="text-sm font-medium text-gray-700">
              Front Side
            </label>
            <Input
              id="inline-front"
              placeholder="Enter question or term..."
              value={front}
              onChange={(e) => setFront(e.target.value)}
              disabled={isPending}
              className="h-12"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="inline-back" className="text-sm font-medium text-gray-700">
              Back Side
            </label>
            <Input
              id="inline-back"
              placeholder="Enter answer or definition..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              disabled={isPending}
              className="h-12"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFront("");
              setBack("");
            }}
            disabled={isPending || (!front && !back)}
            className="px-6"
          >
            Clear
          </Button>
          <Button
            type="submit"
            disabled={isPending || !front.trim() || !back.trim()}
            className="px-6"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Card
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
