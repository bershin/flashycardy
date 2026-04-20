"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FREE_DECK_LIMIT, FEATURES } from "@/lib/plans";
import {
  insertDeck,
  updateDeck,
  deleteDeck,
  getDeckCountByUser,
  getDeckByIdForUser,
  reorderDecks,
} from "@/db/queries/decks";
import { getCardsByDeckForUser } from "@/db/queries/cards";

const createDeckSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).nullish(),
  parentId: z.number().nullish(),
});

type CreateDeckInput = z.infer<typeof createDeckSchema>;

export async function createDeckAction(data: CreateDeckInput) {
  const { userId, has } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = createDeckSchema.parse(data);

  if (parsed.parentId) {
    const parent = await getDeckByIdForUser(parsed.parentId, userId);
    if (!parent) throw new Error("Parent deck not found");
    if (parent.parentId !== null) {
      throw new Error("Cannot nest more than one level deep.");
    }
    const parentCards = await getCardsByDeckForUser(parsed.parentId, userId);
    if (parentCards.length > 0) {
      throw new Error(
        "Cannot add sub-decks to a deck that already has cards.",
      );
    }
  }

  if (!parsed.parentId && !has({ feature: FEATURES.UNLIMITED_DECK })) {
    const deckCount = await getDeckCountByUser(userId);
    if (deckCount >= FREE_DECK_LIMIT) {
      throw new Error(
        "Free plan is limited to 3 decks. Upgrade to Pro for unlimited decks.",
      );
    }
  }

  const deck = await insertDeck({
    title: parsed.title,
    description: parsed.description,
    parentId: parsed.parentId,
    userId,
  });

  revalidatePath("/dashboard");
  if (parsed.parentId) {
    revalidatePath(`/deck/${parsed.parentId}`);
  }
  return deck;
}

const updateDeckSchema = z.object({
  deckId: z.number(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).nullish(),
});

type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export async function updateDeckAction(data: UpdateDeckInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = updateDeckSchema.parse(data);

  const deck = await updateDeck(parsed.deckId, userId, {
    title: parsed.title,
    description: parsed.description,
  });

  if (!deck) throw new Error("Deck not found");

  revalidatePath("/dashboard");
  revalidatePath(`/deck/${parsed.deckId}`);
  return deck;
}

const deleteDeckSchema = z.object({
  deckId: z.number(),
});

type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;

export async function deleteDeckAction(data: DeleteDeckInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = deleteDeckSchema.parse(data);

  const deck = await deleteDeck(parsed.deckId, userId);

  if (!deck) throw new Error("Deck not found");

  revalidatePath("/dashboard");
  return deck;
}

const reorderDecksSchema = z.object({
  orderedIds: z.array(z.number()).min(1),
  parentId: z.number().nullish(),
});

type ReorderDecksInput = z.infer<typeof reorderDecksSchema>;

export async function reorderDecksAction(data: ReorderDecksInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = reorderDecksSchema.parse(data);
  await reorderDecks(userId, parsed.orderedIds);

  revalidatePath("/dashboard");
  if (parsed.parentId) {
    revalidatePath(`/deck/${parsed.parentId}`);
  }
}
