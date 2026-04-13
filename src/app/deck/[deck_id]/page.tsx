import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FEATURES } from "@/lib/plans";
import { getDeckByIdForUser } from "@/db/queries/decks";
import { getCardsByDeckForUser } from "@/db/queries/cards";
import { DeckHeader } from "./deck-header";
import { FlashCard } from "./flash-card";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ deck_id: string }>;
}) {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  const { deck_id } = await params;
  const deckId = Number(deck_id);
  if (Number.isNaN(deckId)) notFound();

  const deck = await getDeckByIdForUser(deckId, userId);
  if (!deck) notFound();

  const cards = await getCardsByDeckForUser(deckId, userId);
  const hasAIFeature = has({ feature: FEATURES.AI_FLASH_CARD_GENERATION });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to decks
      </Link>

      <DeckHeader
        deck={deck}
        cardCount={cards.length}
        hasAIFeature={hasAIFeature}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <FlashCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
