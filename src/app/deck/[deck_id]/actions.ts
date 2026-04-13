"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText, Output } from "ai";
import { FEATURES } from "@/lib/plans";
import { getDeckByIdForUser } from "@/db/queries/decks";
import {
  insertCard,
  getCardByIdForUser,
  updateCard,
  deleteCard,
  bulkInsertCards,
} from "@/db/queries/cards";

const addCardSchema = z.object({
  deckId: z.number(),
  front: z.string().min(1, "Front is required").max(5000),
  back: z.string().min(1, "Back is required").max(5000),
});

type AddCardInput = z.infer<typeof addCardSchema>;

export async function addCardAction(data: AddCardInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = addCardSchema.parse(data);

  const deck = await getDeckByIdForUser(parsed.deckId, userId);
  if (!deck) throw new Error("Deck not found");

  const card = await insertCard({
    deckId: parsed.deckId,
    front: parsed.front,
    back: parsed.back,
  });

  revalidatePath(`/deck/${parsed.deckId}`);
  revalidatePath("/dashboard");
  return card;
}

const updateCardSchema = z.object({
  cardId: z.number(),
  front: z.string().min(1, "Front is required").max(5000),
  back: z.string().min(1, "Back is required").max(5000),
});

type UpdateCardInput = z.infer<typeof updateCardSchema>;

export async function updateCardAction(data: UpdateCardInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = updateCardSchema.parse(data);

  const existingCard = await getCardByIdForUser(parsed.cardId, userId);
  if (!existingCard) throw new Error("Card not found");

  const card = await updateCard(parsed.cardId, userId, {
    front: parsed.front,
    back: parsed.back,
  });

  revalidatePath(`/deck/${existingCard.deckId}`);
  return card;
}

const deleteCardSchema = z.object({
  cardId: z.number(),
});

type DeleteCardInput = z.infer<typeof deleteCardSchema>;

export async function deleteCardAction(data: DeleteCardInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = deleteCardSchema.parse(data);

  const existingCard = await getCardByIdForUser(parsed.cardId, userId);
  if (!existingCard) throw new Error("Card not found");

  await deleteCard(parsed.cardId, userId);

  revalidatePath(`/deck/${existingCard.deckId}`);
  revalidatePath("/dashboard");
}

const AI_CARD_COUNT = 20;

export async function generateCardsWithAIAction(deckId: number) {
  const { userId, has } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!has({ feature: FEATURES.AI_FLASH_CARD_GENERATION })) {
    throw new Error("AI card generation requires a Pro plan");
  }

  const deck = await getDeckByIdForUser(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  const topic = deck.description
    ? `${deck.title} — ${deck.description}`
    : deck.title;

  const { output } = await generateText({
    model: "openai/gpt-5.3-chat",
    output: Output.object({
      schema: z.object({
        cards: z
          .array(z.object({ front: z.string(), back: z.string() }))
          .length(AI_CARD_COUNT),
      }),
    }),
    prompt: `Generate ${AI_CARD_COUNT} flashcards about the following topic: ${topic}. Each card should have a concise question or term on the front and a clear, informative answer on the back.`,
  });

  if (!output?.cards) {
    throw new Error("AI failed to generate cards. Please try again.");
  }

  const rows = output.cards.map((c) => ({
    deckId,
    front: c.front,
    back: c.back,
  }));

  await bulkInsertCards(rows);

  revalidatePath(`/deck/${deckId}`);
  revalidatePath("/dashboard");
}
