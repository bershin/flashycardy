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
import { updateCardAction } from "@/app/deck/[deck_id]/actions";

interface EditCardDialogProps {
  cardId: number;
  front: string;
  back: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCardDialog({
  cardId,
  front: initialFront,
  back: initialBack,
  open,
  onOpenChange,
}: EditCardDialogProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setFront(initialFront);
    setBack(initialBack);
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
        await updateCardAction({
          cardId,
          front: front.trim(),
          back: back.trim(),
        });
        onOpenChange(false);
      } catch {
        setError("Failed to update card. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>
              Update the front and back content for this flashcard.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`edit-front-${cardId}`}>Front</Label>
              <Textarea
                id={`edit-front-${cardId}`}
                placeholder="Question or term…"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                maxLength={5000}
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`edit-back-${cardId}`}>Back</Label>
              <Textarea
                id={`edit-back-${cardId}`}
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
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
