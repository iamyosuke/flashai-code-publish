"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { createCardAction } from "@/app/actions/CardActions";
import { Deck } from "@/lib/types";

interface CreateCardFormProps {
  decks: Deck[];
}

export function CreateCardForm({ decks }: CreateCardFormProps) {
  const router = useRouter();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !front.trim() || !back.trim()) return;

    setIsSubmitting(true);
    try {
      await createCardAction(selectedDeckId, { front, back });
      router.push(`/decks/${selectedDeckId}`);
    } catch (error) {
      console.error("Failed to create card:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deck">Select Deck</Label>
          <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a deck" />
            </SelectTrigger>
            <SelectContent>
              {decks.map(deck => (
                <SelectItem key={deck.id} value={deck.id}>
                  {deck.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="front">Front</Label>
              <Textarea
                id="front"
                value={front}
                onChange={e => setFront(e.target.value)}
                placeholder="Enter the front content of the card"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="back">Back</Label>
              <Textarea
                id="back"
                value={back}
                onChange={e => setBack(e.target.value)}
                placeholder="Enter the back content of the card"
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="modern"
          disabled={
            isSubmitting || !selectedDeckId || !front.trim() || !back.trim()
          }
        >
          {isSubmitting ? "Creating..." : "Create Card"}
        </Button>
      </div>
    </form>
  );
}
