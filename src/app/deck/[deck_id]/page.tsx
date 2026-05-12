import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FEATURES } from "@/lib/plans";
import {
  getDeckByIdForUser,
  getChildDecksWithCards,
} from "@/db/queries/decks";
import { getCardsByDeckForUser } from "@/db/queries/cards";
import { DeckHeader } from "./deck-header";
import { CardGrid } from "./card-grid";
import { SortableChildDecks } from "./sortable-child-decks";

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

  const childDecks = await getChildDecksWithCards(deckId, userId);
  const hasChildren = childDecks.length > 0;

  const cards = hasChildren ? [] : await getCardsByDeckForUser(deckId, userId);
  const hasAIFeature = has({ feature: FEATURES.AI_FLASH_CARD_GENERATION });
  const isTopLevel = deck.parentId === null;

  const backHref = deck.parentId ? `/deck/${deck.parentId}` : "/dashboard";
  const backLabel = deck.parentId ? "Back to parent deck" : "Back to decks";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        href={backHref}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {backLabel}
      </Link>

      <DeckHeader
        deck={deck}
        cardCount={cards.length}
        hasAIFeature={hasAIFeature}
        hasChildren={hasChildren}
        canAddSubDeck={isTopLevel && cards.length === 0}
      />

      {hasChildren ? (
        <SortableChildDecks
          parentId={deckId}
          decks={childDecks.map((child) => {
            const endOfToday = new Date();
            endOfToday.setHours(0, 0, 0, 0);
            endOfToday.setDate(endOfToday.getDate() + 1);
            const totalCards = child.cards.length;
            const dueCount = child.cards.filter(
              (c) => c.nextReviewAt <= endOfToday,
            ).length;

            return {
              id: child.id,
              title: child.title,
              description: child.description,
              updatedAtFormatted: child.updatedAt.toLocaleDateString("en-US"),
              totalCards,
              dueCount,
            };
          })}
        />
      ) : (
        <CardGrid cards={cards} />
      )}
    </div>
  );
}
