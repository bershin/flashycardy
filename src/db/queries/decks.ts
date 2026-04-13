import { db } from "@/db";
import { decks } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function getDecksByUser(userId: string) {
  return db.select().from(decks).where(eq(decks.userId, userId));
}

export async function getDeckCountByUser(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(decks)
    .where(eq(decks.userId, userId));
  return result.count;
}

export async function getDeckByIdForUser(deckId: number, userId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
  return deck;
}

export async function insertDeck(data: {
  title: string;
  description?: string;
  userId: string;
}) {
  const [deck] = await db.insert(decks).values(data).returning();
  return deck;
}

export async function updateDeck(
  deckId: number,
  userId: string,
  data: { title: string; description?: string },
) {
  const [deck] = await db
    .update(decks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  return deck;
}

export async function deleteDeck(deckId: number, userId: string) {
  const [deck] = await db
    .delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  return deck;
}
