import { DeckForm } from "@/app/components/decks/DeckForm";
import { getDeckAction } from "@/app/actions/DeckActions";

export default async function EditDeckPage({
  params,
}: {
  params: { id: string };
}) {
  const deck = await getDeckAction(params.id);

  return <DeckForm mode="edit" deck={deck} returnUrl={`/decks/${params.id}`} />;
}
