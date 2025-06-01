import { getDeckAction } from "@/app/actions/DeckActions";
import { getCardsForDeckAction } from "@/app/actions/CardActions";
import { StudySession } from "@/app/components/study/StudySession";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function StudyPage({ params }: { params: { id: string } }) {
  try {
    const [deck, cards] = await Promise.all([
      getDeckAction(params.id),
      getCardsForDeckAction(params.id),
    ]);

    if (cards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <h1 className="text-2xl font-bold">No Cards to Study</h1>
          <p className="text-muted-foreground">
            This deck doesn&apos;t have any cards yet.
          </p>
          <Button asChild>
            <Link href={`/decks/${params.id}`}>Back to Deck</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Study: {deck.title}</h1>
          <p className="text-muted-foreground">{deck.description}</p>
        </div>
        
        <StudySession deckId={params.id} cards={cards} />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-red-500">Error loading study session</p>
        <Button asChild>
          <Link href="/decks">Back to Decks</Link>
        </Button>
      </div>
    );
  }
}
