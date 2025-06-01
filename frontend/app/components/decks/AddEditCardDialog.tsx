"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/lib/types";

interface CardDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { front: string; back: string }) => void;
  card?: Card;
}

export function AddEditCardDialog({
  open,
  onClose,
  onSave,
  card,
}: CardDialogProps) {
  const [front, setFront] = useState(card?.front || "");
  const [back, setBack] = useState(card?.back || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ front, back });
    setFront("");
    setBack("");
  };
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card ? "Edit Card" : "Add New Card"}</DialogTitle>
          <DialogDescription>
            {card
              ? "Update the flashcard content"
              : "Create a new flashcard for your deck"}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="front" className="text-sm font-medium">
              Front Side
            </label>
            <Input
              id="front"
              placeholder="Enter card front content"
              value={front}
              onChange={e => setFront(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="back" className="text-sm font-medium">
              Back Side
            </label>
            <Input
              id="back"
              placeholder="Enter card back content"
              value={back}
              onChange={e => setBack(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Card</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
