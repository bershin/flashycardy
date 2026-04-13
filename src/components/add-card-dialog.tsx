"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addCardAction } from "@/app/deck/[deck_id]/actions";

interface AddCardDialogProps {
  deckId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCardDialog({
  deckId,
  open,
  onOpenChange,
}: AddCardDialogProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setFront("");
    setBack("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (nextOpen) resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!front.trim()) {
      setError("Front side is required");
      return;
    }
    if (!back.trim()) {
      setError("Back side is required");
      return;
    }

    startTransition(async () => {
      try {
        await addCardAction({
          deckId,
          front: front.trim(),
          back: back.trim(),
        });
        resetForm();
        onOpenChange(false);
      } catch {
        setError("Failed to add card. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Card</DialogTitle>
            <DialogDescription>
              Enter the front and back content for your new flashcard.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="card-front">Front</Label>
              <Textarea
                id="card-front"
                placeholder="Question or term…"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                maxLength={5000}
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="card-back">Back</Label>
              <Textarea
                id="card-back"
                placeholder="Answer or definition…"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                maxLength={5000}
                disabled={isPending}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
