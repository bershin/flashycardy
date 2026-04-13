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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDeckAction } from "@/app/dashboard/actions";

interface EditDeckDialogProps {
  deckId: number;
  title: string;
  description: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDeckDialog({
  deckId,
  title: initialTitle,
  description: initialDescription,
  open,
  onOpenChange,
}: EditDeckDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle(initialTitle);
    setDescription(initialDescription ?? "");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (nextOpen) resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        await updateDeckAction({
          deckId,
          title: title.trim(),
          description: description.trim() || undefined,
        });
        onOpenChange(false);
      } catch {
        setError("Failed to update deck. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription>
              Update the title and description for this deck.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`title-${deckId}`}>Title</Label>
              <Input
                id={`title-${deckId}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`desc-${deckId}`}>Description</Label>
              <Input
                id={`desc-${deckId}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
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
