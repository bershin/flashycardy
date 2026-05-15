import { db } from "@/db";
import { decks, cards } from "@/db/schema";
import { eq, and, count, inArray, isNull, asc, sql } from "drizzle-orm";

export async function getDecksByUser(userId: string) {
  return db.select().from(decks).where(eq(decks.userId, userId));
}

export async function getDeckCountByUser(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(decks)
    .where(and(eq(decks.userId, userId), isNull(decks.parentId)));
  return result.count;
}

export async function getDeckByIdForUser(deckId: number, userId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
  return deck;
}

export async function getChildDecks(parentId: number, userId: string) {
  return db
    .select()
    .from(decks)
    .where(and(eq(decks.parentId, parentId), eq(decks.userId, userId)))
    .orderBy(asc(decks.position));
}

export async function getDecksWithCardsByUser(userId: string) {
  const userDecks = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId));

  if (userDecks.length === 0) return [];

  const deckIds = userDecks.map((d) => d.id);
  const allCards = await db
    .select()
    .from(cards)
    .where(inArray(cards.deckId, deckIds));

  const cardsByDeck = new Map<number, (typeof allCards)[number][]>();
  for (const card of allCards) {
    const list = cardsByDeck.get(card.deckId) ?? [];
    list.push(card);
    cardsByDeck.set(card.deckId, list);
  }

  const topLevel = userDecks
    .filter((d) => d.parentId === null)
    .sort((a, b) => a.position - b.position);
  const children = userDecks.filter((d) => d.parentId !== null);

  const childrenByParent = new Map<number, typeof userDecks>();
  for (const child of children) {
    const list = childrenByParent.get(child.parentId!) ?? [];
    list.push(child);
    childrenByParent.set(child.parentId!, list);
  }

  return topLevel.map((deck) => {
    const deckChildren = childrenByParent.get(deck.id) ?? [];
    const isParent = deckChildren.length > 0;

    let deckCards: (typeof allCards)[number][] = [];
    let lastStudiedAt = deck.lastStudiedAt;

    if (isParent) {
      for (const child of deckChildren) {
        deckCards = deckCards.concat(cardsByDeck.get(child.id) ?? []);
        if (
          child.lastStudiedAt &&
          (!lastStudiedAt || child.lastStudiedAt > lastStudiedAt)
        ) {
          lastStudiedAt = child.lastStudiedAt;
        }
      }
    } else {
      deckCards = cardsByDeck.get(deck.id) ?? [];
    }

    return {
      ...deck,
      lastStudiedAt,
      cards: deckCards,
      childCount: deckChildren.length,
    };
  });
}

export async function getChildDecksWithCards(parentId: number, userId: string) {
  const childDecks = await getChildDecks(parentId, userId);
  if (childDecks.length === 0) return [];

  const childIds = childDecks.map((d) => d.id);
  const childCards = await db
    .select()
    .from(cards)
    .where(inArray(cards.deckId, childIds));

  const cardsByDeck = new Map<number, (typeof childCards)[number][]>();
  for (const card of childCards) {
    const list = cardsByDeck.get(card.deckId) ?? [];
    list.push(card);
    cardsByDeck.set(card.deckId, list);
  }

  return childDecks.map((deck) => ({
    ...deck,
    cards: cardsByDeck.get(deck.id) ?? [],
  }));
}

export async function insertDeck(data: {
  title: string;
  description?: string;
  userId: string;
  parentId?: number;
}) {
  const [maxPos] = await db
    .select({ max: sql<number>`coalesce(max(${decks.position}), -1)` })
    .from(decks)
    .where(
      data.parentId
        ? and(eq(decks.userId, data.userId), eq(decks.parentId, data.parentId))
        : and(eq(decks.userId, data.userId), isNull(decks.parentId)),
    );

  const [deck] = await db
    .insert(decks)
    .values({ ...data, position: maxPos.max + 1 })
    .returning();
  return deck;
}

export async function reorderDecks(
  userId: string,
  orderedIds: number[],
) {
  const updates = orderedIds.map((id, index) =>
    db
      .update(decks)
      .set({ position: index })
      .where(and(eq(decks.id, id), eq(decks.userId, userId))),
  );
  await Promise.all(updates);
}

export async function updateDeck(
  deckId: number,
  userId: string,
  data: { title: string; description?: string | null },
) {
  const [deck] = await db
    .update(decks)
    .set({
      title: data.title,
      description: data.description ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning();
  return deck;
}

export async function markDeckStudied(deckId: number, userId: string) {
  const [deck] = await db
    .update(decks)
    .set({ lastStudiedAt: new Date() })
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
