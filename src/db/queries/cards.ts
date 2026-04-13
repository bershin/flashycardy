import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

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
