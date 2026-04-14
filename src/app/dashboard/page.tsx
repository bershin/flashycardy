import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FREE_DECK_LIMIT, FEATURES } from "@/lib/plans";
import { getDecksWithCardsByUser } from "@/db/queries/decks";
import { CreateDeckButton } from "./create-deck-button";
import { DashboardSearch } from "./dashboard-search";

export default async function DashboardPage() {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  const userDecks = await getDecksWithCardsByUser(userId);
  const hasUnlimitedDecks = has({ feature: FEATURES.UNLIMITED_DECK });
  const canCreateDeck = hasUnlimitedDecks || userDecks.length < FREE_DECK_LIMIT;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Your Decks</h1>
            {hasUnlimitedDecks && (
              <span className="rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                Pro
              </span>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {userDecks.length === 0
              ? "You don't have any decks yet. Create one to get started!"
              : `${userDecks.length} deck${userDecks.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <CreateDeckButton canCreateDeck={canCreateDeck} />
      </div>

      {!hasUnlimitedDecks && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Free Plan &mdash; {userDecks.length} / {FREE_DECK_LIMIT} decks
                used
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-800">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all dark:bg-amber-400"
                  style={{
                    width: `${Math.min((userDecks.length / FREE_DECK_LIMIT) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-sm text-amber-700 dark:text-amber-300">
                {canCreateDeck
                  ? `You can create ${FREE_DECK_LIMIT - userDecks.length} more deck${FREE_DECK_LIMIT - userDecks.length === 1 ? "" : "s"}.`
                  : "You've reached your deck limit."}
                {" "}
                Upgrade to Pro for unlimited decks.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}

      <DashboardSearch
        decks={userDecks.map((deck) => {
          const now = new Date();
          const totalCards = deck.cards.length;
          const dueCount = deck.cards.filter(
            (c) => c.nextReviewAt <= now,
          ).length;

          return {
            ...deck,
            updatedAtFormatted: deck.updatedAt.toLocaleDateString("en-US"),
            totalCards,
            dueCount,
          };
        })}
      />
    </div>
  );
}
