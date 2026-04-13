import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDeckByIdForUser } from "@/db/queries/decks";
import { getCardsByDeckForUser } from "@/db/queries/cards";
import { StudySession } from "./study-session";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ deck_id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { deck_id } = await params;
  const deckId = Number(deck_id);
  if (Number.isNaN(deckId)) notFound();

  const deck = await getDeckByIdForUser(deckId, userId);
  if (!deck) notFound();

  const cards = await getCardsByDeckForUser(deckId, userId);

  if (cards.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          href={`/deck/${deck_id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to deck
        </Link>
        <div className="mt-16 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{deck.title}</h1>
          <p className="mt-2 text-muted-foreground">
            This deck has no cards yet. Add some cards before studying.
          </p>
          <Link
            href={`/deck/${deck_id}`}
            className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Go back and add cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        href={`/deck/${deck_id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to deck
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{deck.title}</h1>
      <StudySession cards={cards} />
    </div>
  );
}
