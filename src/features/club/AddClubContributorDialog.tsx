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

import { useAddClubContributor } from "./hook/clubHooks";

interface AddClubContributorDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddClubContributorDialog({ open, onClose }: AddClubContributorDialogProps) {
  const { mutateAsync: addContributor, isPending } = useAddClubContributor();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setName("");
    setPhone("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addContributor({ name: name.trim(), phone: phone.trim() || undefined });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Person</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            People here are just for the club room — separate from foundation members.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="club-person-name">Name *</Label>
            <Input
              id="club-person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="club-person-phone">Phone (optional)</Label>
            <Input
              id="club-person-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || name.trim().length < 2} className="gap-2">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Add Person
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
