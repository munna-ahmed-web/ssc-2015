"use client";

/* eslint-disable @typescript-eslint/no-misused-promises */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getRecentPeriods } from "@/lib/periods";
import { getPeriodLabel } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberResult {
  _id: string;
  fullName: string;
  memberCode: string;
  phone: string;
  contributionType: "weekly" | "monthly";
  contributionAmount: number;
  status: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const RecordSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  periodLabel: z.string().min(1, "Please select a period"),
  paidAt: z.string().min(10, "Please enter payment date"),
  notes: z.string().max(500).optional(),
});
type RecordFormData = z.infer<typeof RecordSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecordContributionForm() {
  const router = useRouter();

  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecordFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(RecordSchema) as any,
    defaultValues: {
      paidAt: new Date().toISOString().split("T")[0],
    },
  });

  const selectedPeriod = watch("periodLabel");

  // ── Member search ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!memberSearch || memberSearch.length < 2) {
      setMemberResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/members?search=${encodeURIComponent(memberSearch)}&status=active&limit=10`,
        );
        const data = await res.json();
        setMemberResults(data.success ? data.data : []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  const selectMember = (member: MemberResult) => {
    setSelectedMember(member);
    setValue("memberId", member._id);
    setMemberSearch(member.fullName);
    setMemberResults([]);
    // Auto-select current period based on member's contribution type
    setValue("periodLabel", getPeriodLabel(member.contributionType));
  };

  // ── Periods dropdown ───────────────────────────────────────────────────────

  const periodOptions = selectedMember
    ? getRecentPeriods(selectedMember.contributionType, 12)
    : [...getRecentPeriods("monthly", 6), ...getRecentPeriods("weekly", 6)];

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: RecordFormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/admin/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setServerError(result.error ?? "Failed to record contribution.");
        return;
      }
      router.push("/dashboard/contributions");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/dashboard/contributions">
            <ArrowLeft className="size-4" />
            Contributions
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h2>Record Contribution</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {serverError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Member selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Select Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input type="hidden" {...register("memberId")} />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="member-search"
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  if (!e.target.value) {
                    setSelectedMember(null);
                    setValue("memberId", "");
                    setValue("periodLabel", "");
                  }
                }}
                placeholder="Search by name, phone, or member code…"
                className="pl-9"
                autoComplete="off"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Dropdown results */}
            {memberResults.length > 0 && (
              <div className="rounded-lg border border-border bg-card shadow-md overflow-hidden divide-y divide-border">
                {memberResults.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => selectMember(m)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.memberCode} · {m.phone}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">
                      {m.contributionType}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {errors.memberId && (
              <p className="text-xs text-destructive">{errors.memberId.message}</p>
            )}

            {/* Selected member summary */}
            {selectedMember && (
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{selectedMember.fullName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedMember.memberCode}
                  </Badge>
                </div>
                <div className="flex gap-4 text-muted-foreground text-xs">
                  <span className="capitalize">{selectedMember.contributionType}</span>
                  <span>৳{selectedMember.contributionAmount.toLocaleString()} / period</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Period & payment details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="periodLabel">Contribution Period *</Label>
              <Controller
                control={control}
                name="periodLabel"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="periodLabel">
                      <SelectValue placeholder="Select period…" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {selectedPeriod && (
                <p className="text-xs text-muted-foreground">
                  Period code: <code className="text-foreground">{selectedPeriod}</code>
                </p>
              )}
              {errors.periodLabel && (
                <p className="text-xs text-destructive">{errors.periodLabel.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paidAt">Payment Date *</Label>
              <Input id="paidAt" type="date" {...register("paidAt")} />
              {errors.paidAt && <p className="text-xs text-destructive">{errors.paidAt.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Any additional notes…"
                className="resize-none"
                {...register("notes")}
              />
              {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Amount preview */}
        {selectedMember && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4">
            <p className="text-xs text-muted-foreground">Amount to be recorded</p>
            <p className="text-2xl font-bold font-heading text-foreground mt-1">
              ৳{selectedMember.contributionAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Auto-filled from {selectedMember.fullName}&apos;s member record
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || !selectedMember} className="gap-2">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? "Recording…" : "Record Contribution"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/contributions">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
