"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle, Pencil, Trash2 } from "lucide-react";
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
    totalCards: number;
    dueCount: number;
  };
}

export function DeckCard({ deck }: DeckCardProps) {
  const router = useRouter();
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
      <Card className="transition-colors hover:bg-muted/50">
        <Link href={`/deck/${deck.id}`}>
          <CardHeader>
            <CardTitle>{deck.title}</CardTitle>
            {deck.description && (
              <CardDescription>{deck.description}</CardDescription>
            )}
          </CardHeader>
        </Link>
        <CardFooter className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Updated {deck.updatedAtFormatted}
          </p>
          <div className="flex items-center gap-2">
            {deck.totalCards > 0 && (
              deck.dueCount > 0 ? (
                <button
                  type="button"
                  onClick={() => router.push(`/deck/${deck.id}/study`)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <BookOpen className="size-3" />
                  {deck.dueCount} due
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="size-3" />
                  All caught up
                </span>
              )
            )}
          </div>
        </CardFooter>
      </Card>

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
