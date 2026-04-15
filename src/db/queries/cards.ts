import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { eq, and, desc, inArray, lte } from "drizzle-orm";

export async function getCardsByDeckForUser(deckId: number, userId: string) {
  return db
    .select({ card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.deckId, deckId), eq(decks.userId, userId)))
    .orderBy(desc(cards.updatedAt))
    .then((rows) => rows.map((r) => r.card));
}

export async function getCardByIdForUser(cardId: number, userId: string) {
  const [row] = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.id, cardId), eq(decks.userId, userId)));
  return row?.card;
}

export async function insertCard(data: {
  deckId: number;
  front: string;
  back: string;
}) {
  const [card] = await db.insert(cards).values(data).returning();
  return card;
}

export async function bulkInsertCards(
  rows: { deckId: number; front: string; back: string }[],
) {
  if (rows.length === 0) return [];
  return db.insert(cards).values(rows).returning();
}

export async function updateCard(
  cardId: number,
  userId: string,
  data: { front?: string; back?: string },
) {
  const [card] = await db
    .update(cards)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(cards.id, cardId),
        inArray(
          cards.deckId,
          db
            .select({ id: decks.id })
            .from(decks)
            .where(eq(decks.userId, userId)),
        ),
      ),
    )
    .returning();
  return card;
}

export async function getDueCardsByDeckForUser(
  deckId: number,
  userId: string,
) {
  const endOfToday = startOfDay(new Date());
  endOfToday.setDate(endOfToday.getDate() + 1);

  return db
    .select({ card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cards.deckId, deckId),
        eq(decks.userId, userId),
        lte(cards.nextReviewAt, endOfToday),
      ),
    )
    .orderBy(desc(cards.updatedAt))
    .then((rows) => rows.map((r) => r.card));
}

export async function recordStudyResult(
  cardId: number,
  userId: string,
  rating: "got_it" | "missed",
) {
  const existing = await getCardByIdForUser(cardId, userId);
  if (!existing) throw new Error("Card not found");

  const now = new Date();
  const today = startOfDay(now);
  let consecutiveCorrect: number;
  let nextReviewAt: Date;

  if (rating === "missed") {
    consecutiveCorrect = 0;
    nextReviewAt = addDays(today, 1);
  } else {
    consecutiveCorrect = existing.consecutiveCorrect + 1;
    nextReviewAt = consecutiveCorrect >= 2 ? addDays(today, 7) : addDays(today, 1);
  }

  const [card] = await db
    .update(cards)
    .set({ consecutiveCorrect, nextReviewAt, updatedAt: now })
    .where(
      and(
        eq(cards.id, cardId),
        inArray(
          cards.deckId,
          db
            .select({ id: decks.id })
            .from(decks)
            .where(eq(decks.userId, userId)),
        ),
      ),
    )
    .returning();
  return card;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function deleteCard(cardId: number, userId: string) {
  const [card] = await db
    .delete(cards)
    .where(
      and(
        eq(cards.id, cardId),
        inArray(
          cards.deckId,
          db
            .select({ id: decks.id })
            .from(decks)
            .where(eq(decks.userId, userId)),
        ),
      ),
    )
    .returning();
  return card;
}
