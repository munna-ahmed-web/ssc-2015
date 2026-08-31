"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useProposeInvestment } from "./hook/investmentHooks";

interface ProposeInvestmentDialogProps {
  open: boolean;
  onClose: () => void;
  availableBalance: number | null;
}

export default function ProposeInvestmentDialog({
  open,
  onClose,
  availableBalance,
}: ProposeInvestmentDialogProps) {
  const { mutateAsync: propose, isPending } = useProposeInvestment();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [principal, setPrincipal] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPrincipal("");
    setExpectedReturnDate("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await propose({
        title: title.trim(),
        description: description.trim() || undefined,
        principal: Number(principal),
        expectedReturnDate,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Propose Investment</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {availableBalance !== null && (
            <div className="rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm">
              Available fund balance:{" "}
              <span className="font-semibold">৳{availableBalance.toLocaleString()}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="inv-title">Sector / Title *</Label>
            <Input
              id="inv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Poultry business with Karim Traders"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-description">Description</Label>
            <Textarea
              id="inv-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Terms, contact person, agreement details…"
              className="resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-principal">Amount (৳) *</Label>
              <Input
                id="inv-principal"
                type="number"
                min={1}
                step={1}
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="e.g. 100000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-return-date">Expected Return Date *</Label>
              <Input
                id="inv-return-date"
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            A different admin must approve this proposal before any money is counted as invested.
          </p>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !title.trim() || !principal || !expectedReturnDate}
              className="gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Propose
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
