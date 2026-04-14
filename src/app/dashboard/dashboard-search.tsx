"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DeckCard } from "./deck-card";

interface CardData {
  id: number;
  front: string;
  back: string;
}

interface DeckWithCards {
  id: number;
  title: string;
  description: string | null;
  updatedAtFormatted: string;
  cards: CardData[];
}

interface DashboardSearchProps {
  decks: DeckWithCards[];
}

export function DashboardSearch({ decks }: DashboardSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return decks.map((deck) => ({ deck, matchingCards: [] as CardData[] }));

    return decks
      .map((deck) => {
        const titleMatch =
          deck.title.toLowerCase().includes(q) ||
          deck.description?.toLowerCase().includes(q);

        const matchingCards = deck.cards.filter(
          (card) =>
            card.front.toLowerCase().includes(q) ||
            card.back.toLowerCase().includes(q),
        );

        return { deck, matchingCards, titleMatch };
      })
      .filter(({ titleMatch, matchingCards }) => titleMatch || matchingCards.length > 0);
  }, [query, decks]);

  const isSearching = query.trim().length > 0;

  return (
    <>
      <div className="relative mt-6">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Search decks and cards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 pl-9 pr-9"
        />
        {isSearching && (
          <button
            onClick={() => setQuery("")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          >
            <X className="size-4" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>

      {isSearching && (
        <p className="text-muted-foreground mt-3 text-sm">
          {filtered.length === 0
            ? "No results found."
            : `${filtered.length} deck${filtered.length === 1 ? "" : "s"} matched`}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {filtered.map(({ deck, matchingCards }) => (
          <div key={deck.id} className="flex flex-col gap-2">
            <DeckCard
              deck={{
                id: deck.id,
                title: deck.title,
                description: deck.description,
                updatedAtFormatted: deck.updatedAtFormatted,
              }}
            />
            {isSearching && matchingCards.length > 0 && (
              <div className="ml-3 space-y-1.5 border-l-2 border-violet-300 pl-3 dark:border-violet-700">
                {matchingCards.map((card) => (
                  <MatchingCard key={card.id} card={card} query={query} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function MatchingCard({ card, query }: { card: CardData; query: string }) {
  return (
    <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
      <div>
        <span className="text-muted-foreground mr-1.5 text-xs font-medium uppercase">
          Front
        </span>
        <Highlighted text={card.front} query={query} />
      </div>
      <div className="mt-1">
        <span className="text-muted-foreground mr-1.5 text-xs font-medium uppercase">
          Back
        </span>
        <Highlighted text={card.back} query={query} />
      </div>
    </div>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <span>{text}</span>;

  const parts: { text: string; highlight: boolean }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const idx = remaining.toLowerCase().indexOf(q);
    if (idx === -1) {
      parts.push({ text: remaining, highlight: false });
      break;
    }
    if (idx > 0) {
      parts.push({ text: remaining.slice(0, idx), highlight: false });
    }
    parts.push({ text: remaining.slice(idx, idx + q.length), highlight: true });
    remaining = remaining.slice(idx + q.length);
  }

  return (
    <span>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark
            key={i}
            className="rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-800 dark:text-yellow-100"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
