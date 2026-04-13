"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditCardDialog } from "@/components/edit-card-dialog";
import { deleteCardAction } from "./actions";

interface FlashCardProps {
  card: {
    id: number;
    front: string;
    back: string;
  };
}

export function FlashCard({ card }: FlashCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCardAction({ cardId: card.id });
        setDeleteOpen(false);
      } catch {
        // keep dialog open so the user can retry
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{card.front}</CardTitle>
            <div className="flex shrink-0 gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-3.5" />
                <span className="sr-only">Edit card</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Delete card</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{card.back}</p>
        </CardContent>
      </Card>

      <EditCardDialog
        cardId={card.id}
        front={card.front}
        back={card.back}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this card? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
