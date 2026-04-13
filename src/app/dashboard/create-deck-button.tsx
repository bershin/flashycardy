"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateDeckDialog } from "@/components/create-deck-dialog";

interface CreateDeckButtonProps {
  canCreateDeck: boolean;
}

export function CreateDeckButton({ canCreateDeck }: CreateDeckButtonProps) {
  const [open, setOpen] = useState(false);

  if (!canCreateDeck) {
    return (
      <Button render={<Link href="/pricing" />}>Upgrade to Pro</Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Deck
      </Button>
      <CreateDeckDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
