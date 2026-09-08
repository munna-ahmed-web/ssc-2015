"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { getMembers } from "@/features/members/api/members";

import { useProposeLoan } from "./hook/loanHooks";

interface MemberHit {
  _id: string;
  fullName: string;
  memberCode: string;
  phone: string;
}

interface ProposeLoanDialogProps {
  open: boolean;
  onClose: () => void;
  availableBalance: number | null;
}

export default function ProposeLoanDialog({
  open,
  onClose,
  availableBalance,
}: ProposeLoanDialogProps) {
  const { mutateAsync: propose, isPending } = useProposeLoan();

  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberHit | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<MemberHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [principal, setPrincipal] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // All state updates happen inside the debounce callback, never synchronously
    // in the effect body.
    const timer = setTimeout(() => {
      if (selectedMember || memberSearch.trim().length < 2) {
        setMemberResults([]);
        return;
      }
      setSearching(true);
      getMembers({ search: memberSearch, status: "active", limit: 8 })
        .then((d) => setMemberResults(d.members as unknown as MemberHit[]))
        .catch(() => setMemberResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, selectedMember]);

  const reset = () => {
    setBorrowerName("");
    setBorrowerPhone("");
    setSelectedMember(null);
    setMemberSearch("");
    setMemberResults([]);
    setPurpose("");
    setPrincipal("");
    setExpectedReturnDate("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const effectiveName = selectedMember?.fullName ?? borrowerName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await propose({
        borrowerName: effectiveName,
        borrowerMemberId: selectedMember?._id,
        borrowerPhone: borrowerPhone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        principal: Number(principal),
        expectedReturnDate,
      });
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propose Loan</DialogTitle>
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

          {/* Borrower: a member, or anyone else */}
          <div className="space-y-1.5">
            <Label htmlFor="loan-member-search">Borrower — search members (optional)</Label>
            {selectedMember ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedMember.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMember.memberCode} · {selectedMember.phone}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedMember(null);
                    setMemberSearch("");
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="loan-member-search"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name, phone or code…"
                    className="pl-9"
                    autoComplete="off"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                  )}
                </div>
                {memberResults.length > 0 && (
                  <div className="rounded-lg border border-border bg-card shadow-md overflow-hidden divide-y divide-border">
                    {memberResults.map((m) => (
                      <button
                        key={m._id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setSelectedMember(m);
                          setBorrowerName(m.fullName);
                          setBorrowerPhone(m.phone);
                          setMemberResults([]);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.memberCode} · {m.phone}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          Member
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {!selectedMember && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="loan-borrower">Borrower Name *</Label>
                <Input
                  id="loan-borrower"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Person or institution"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-phone">Phone</Label>
                <Input
                  id="loan-phone"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="loan-principal">Amount (৳) *</Label>
              <Input
                id="loan-principal"
                type="number"
                min={1}
                step={1}
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="e.g. 10000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-return-date">Expected Return Date *</Label>
              <Input
                id="loan-return-date"
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-purpose">Purpose</Label>
            <Textarea
              id="loan-purpose"
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why is the loan needed?"
              className="resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Interest-free: the borrower repays exactly what was lent — no profit is charged. A
            different admin must approve before the money is disbursed.
          </p>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !effectiveName || !principal || !expectedReturnDate}
              className="gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Propose Loan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
