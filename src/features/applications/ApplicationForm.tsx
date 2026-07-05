"use client";

import { useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Upload } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { ApplicationSchema, type ApplicationFormData } from "@/lib/validation/application.schema";

// ─── Inline FieldError (avoids installing extra shadcn component) ─────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

// ─── Duplicate warning banner ─────────────────────────────────────────────────

interface DuplicateWarning {
  field: "phone" | "nid";
  status: "pending" | "approved";
}

function DuplicateWarningBanner({ warning }: { warning: DuplicateWarning }) {
  return (
    <div className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-warning" />
      <p className="text-sm text-warning">
        <strong>Heads up:</strong> A {warning.status === "pending" ? "pending" : "approved"}{" "}
        application with this {warning.field === "phone" ? "phone number" : "National ID"} already
        exists. You can still submit, but it may be reviewed carefully.
      </p>
    </div>
  );
}

// ─── Form sections ─────────────────────────────────────────────────────────────

function SectionHeader({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 pb-4 border-b border-border mb-6">
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
        {step}
      </span>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main form component ──────────────────────────────────────────────────────

export default function ApplicationForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ApplicationSchema) as any,
    defaultValues: {
      requestedContributionType: "monthly",
      requestedContributionAmount: 100,
    },
  });

  // ── Duplicate check ──────────────────────────────────────────────────────

  const checkDuplicate = async (phone?: string, nid?: string) => {
    if (!phone && !nid) return;
    setCheckingDuplicate(true);
    try {
      const params = new URLSearchParams();
      if (phone) params.set("phone", phone);
      if (nid) params.set("nid", nid);
      const res = await fetch(`/api/applications?${params}`);
      const data = await res.json();
      if (data.duplicate) {
        setDuplicateWarning({ field: data.field, status: data.status });
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Silently fail — soft check only
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const phone = watch("phone");
  const nid = watch("nid");

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setSubmitError(result.error ?? "Submission failed. Please try again.");
        return;
      }
      router.push("/become-a-member/success");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
      {/* ── Section 1: Personal Information ── */}
      <section>
        <SectionHeader step="1" title="Personal Information" desc="Basic details about you" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="e.g. Md. Rahim Uddin"
              aria-invalid={!!errors.fullName}
              className={errors.fullName ? "border-destructive" : ""}
              {...register("fullName")}
            />
            <FieldError message={errors.fullName?.message} />
          </div>

          {/* Guardian Name */}
          <div className="space-y-1.5">
            <Label htmlFor="guardianName">Father / Guardian Name *</Label>
            <Input
              id="guardianName"
              placeholder="e.g. Md. Karim Uddin"
              aria-invalid={!!errors.guardianName}
              className={errors.guardianName ? "border-destructive" : ""}
              {...register("guardianName")}
            />
            <FieldError message={errors.guardianName?.message} />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+8801XXXXXXXXX"
              aria-invalid={!!errors.phone}
              className={errors.phone ? "border-destructive" : ""}
              {...register("phone")}
              onBlur={() => {
                if (phone && !errors.phone) checkDuplicate(phone, undefined);
              }}
            />
            <FieldError message={errors.phone?.message} />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              className={errors.email ? "border-destructive" : ""}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          {/* NID */}
          <div className="space-y-1.5">
            <Label htmlFor="nid">National ID (NID) *</Label>
            <Input
              id="nid"
              placeholder="Your NID number"
              aria-invalid={!!errors.nid}
              className={errors.nid ? "border-destructive" : ""}
              {...register("nid")}
              onBlur={() => {
                if (nid && !errors.nid) checkDuplicate(undefined, nid);
              }}
            />
            <FieldError message={errors.nid?.message} />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              aria-invalid={!!errors.dateOfBirth}
              className={errors.dateOfBirth ? "border-destructive" : ""}
              {...register("dateOfBirth")}
            />
            <FieldError message={errors.dateOfBirth?.message} />
          </div>

          {/* Occupation */}
          <div className="space-y-1.5">
            <Label htmlFor="occupation">
              Occupation <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="occupation"
              placeholder="e.g. Engineer, Teacher, Student"
              {...register("occupation")}
            />
          </div>
        </div>

        {/* Address — full width */}
        <div className="space-y-1.5 mt-5">
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            placeholder="Village, Union, Upazila, District"
            rows={3}
            aria-invalid={!!errors.address}
            className={cn("resize-none", errors.address ? "border-destructive" : "")}
            {...register("address")}
          />
          <FieldError message={errors.address?.message} />
        </div>
      </section>

      {/* ── Duplicate warning ── */}
      {duplicateWarning && <DuplicateWarningBanner warning={duplicateWarning} />}
      {checkingDuplicate && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-3 animate-spin" /> Checking for duplicates…
        </p>
      )}

      {/* ── Section 2: Contribution Preferences ── */}
      <section>
        <SectionHeader
          step="2"
          title="Contribution Preferences"
          desc="Your desired contribution schedule and amount"
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Contribution type */}
          <div className="space-y-1.5">
            <Label htmlFor="contributionType">Contribution Type *</Label>
            <Controller
              name="requestedContributionType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="contributionType"
                    aria-invalid={!!errors.requestedContributionType}
                    className={errors.requestedContributionType ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.requestedContributionType?.message} />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (৳) *</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              placeholder="e.g. 100"
              aria-invalid={!!errors.requestedContributionAmount}
              className={errors.requestedContributionAmount ? "border-destructive" : ""}
              {...register("requestedContributionAmount")}
            />
            <FieldError message={errors.requestedContributionAmount?.message} />
          </div>
        </div>
      </section>

      {/* ── Section 3: Photo Upload ── */}
      <section>
        <SectionHeader
          step="3"
          title="Profile Photo"
          desc="Upload a recent passport-size photo (optional in v1)"
        />
        <div className="flex items-center gap-4 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Upload className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Photo upload coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              File upload will be available in a future update. Your application will be processed
              without a photo for now.
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">
            Phase 5
          </Badge>
        </div>
      </section>

      {/* ── Submit error ── */}
      {submitError && (
        <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-destructive" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto gap-2">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Submitting…" : "Submit Application"}
        </Button>
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          By submitting, your application will be reviewed by an admin before approval.
        </p>
      </div>
    </form>
  );
}
