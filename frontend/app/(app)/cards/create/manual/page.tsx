import { CreateCardForm } from "./CreateCardForm";
import { getDecksAction } from "@/app/actions/DeckActions";
import { Deck } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CreateCardPage() {
  let decks: Deck[] = [];
  try {
    decks = await getDecksAction();
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-red-500">Failed to load decks</p>
        <Button asChild variant="modern" size="lg">
          <Link href="/decks">Back to Decks</Link>
        </Button>
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-muted-foreground">You need to create a deck first</p>
        <Button asChild variant="modern">
          <Link href="/decks/create">Create a Deck</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create a Card</h1>
          <p className="text-muted-foreground mt-1">
            Add a new card to one of your decks
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/cards">Back</Link>
        </Button>
      </div>

      <CreateCardForm decks={decks} />
    </div>
  );
}
