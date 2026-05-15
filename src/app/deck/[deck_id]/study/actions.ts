"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";
import { recordStudyResult } from "@/db/queries/cards";
import { markDeckStudied } from "@/db/queries/decks";

const rateCardSchema = z.object({
  cardId: z.number(),
  deckId: z.number(),
  rating: z.enum(["got_it", "missed"]),
});

type RateCardInput = z.infer<typeof rateCardSchema>;

export async function rateCardAction(data: RateCardInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = rateCardSchema.parse(data);
  const card = await recordStudyResult(parsed.cardId, userId, parsed.rating);

  revalidatePath(`/deck/${parsed.deckId}`);
  refresh();

  return card;
}

export async function markDeckStudiedAction(deckId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await markDeckStudied(deckId, userId);
  revalidatePath("/dashboard");
  revalidatePath(`/deck/${deckId}`);
}
