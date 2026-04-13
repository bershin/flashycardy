"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditDeckDialog } from "@/components/edit-deck-dialog";
import { deleteDeckAction } from "./actions";

interface DeckCardProps {
  deck: {
    id: number;
    title: string;
    description: string | null;
    updatedAtFormatted: string;
  };
}

export function DeckCard({ deck }: DeckCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteDeckAction({ deckId: deck.id });
      } catch {
        // TODO: surface error via toast
      }
    });
  }

  return (
    <div className="group/deck relative">
      <Link href={`/deck/${deck.id}`}>
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle>{deck.title}</CardTitle>
            {deck.description && (
              <CardDescription>{deck.description}</CardDescription>
            )}
          </CardHeader>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Updated {deck.updatedAtFormatted}
            </p>
          </CardFooter>
        </Card>
      </Link>

      <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover/deck:opacity-100 focus-within:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault();
            setEditOpen(true);
          }}
        >
          <Pencil className="size-3.5" />
          <span className="sr-only">Edit deck</span>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault();
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Delete deck</span>
        </Button>
      </div>

      <EditDeckDialog
        deckId={deck.id}
        title={deck.title}
        description={deck.description}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deck.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this deck and all of its cards. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting\u2026" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
