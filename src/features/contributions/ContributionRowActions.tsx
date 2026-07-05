"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { IContribution } from "@/models";

import ReversalModal from "./ReversalModal";

interface ContributionRowActionsProps {
  contribution: IContribution & { _id: { toString(): string }; createdAt: Date };
}

export function ContributionRowActions({ contribution }: ContributionRowActionsProps) {
  const [reversalOpen, setReversalOpen] = useState(false);

  if (contribution.isReversal) return null;

  return (
    <>
      <Button
        size="xs"
        variant="ghost"
        className="gap-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setReversalOpen(true)}
        title="Create reversal entry"
      >
        <Undo2 className="size-3" />
        Reverse
      </Button>
      <ReversalModal
        contributionId={contribution._id.toString()}
        memberName={contribution.memberName}
        periodLabel={contribution.periodLabel}
        amount={contribution.amount}
        open={reversalOpen}
        onClose={() => setReversalOpen(false)}
      />
    </>
  );
}
