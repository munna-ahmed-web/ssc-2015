"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApplicationSchema, type ApplicationFormData } from "@/lib/validation/application.schema";
import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from "@/lib/api/response";

// ─── Inline FieldError (avoids installing extra shadcn component) ─────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

// ─── Duplicate conflict (from GET /api/applications/check) ────────────────────

interface DuplicateConflict {
  field: "phone" | "nid";
  status: "pending" | "approved";
  message: string;
}

function DuplicateWarningBanner({ conflicts }: { conflicts: DuplicateConflict[] }) {
  return (
    <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-destructive" />
      <div className="space-y-1 text-sm text-destructive">
        <p className="font-medium">This application cannot be submitted.</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {conflicts.map((conflict) => (
            <li key={conflict.field}>{conflict.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

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
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image size must be smaller than 5 MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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

  const checkDuplicate = async (phoneValue?: string, nidValue?: string) => {
    const phoneToCheck = phoneValue?.trim();
    const nidToCheck = nidValue?.trim();
    if (!phoneToCheck && !nidToCheck) return;

    setCheckingDuplicate(true);
    try {
      const params = new URLSearchParams();
      if (phoneToCheck) params.set("phone", phoneToCheck);
      if (nidToCheck) params.set("nid", nidToCheck);

      const res = await fetch(`/api/applications/check?${params}`);
      const body = await res.json();
      const payload = body.data ?? body;

      if (payload.duplicate && Array.isArray(payload.conflicts)) {
        setDuplicateConflicts(payload.conflicts);
      } else {
        setDuplicateConflicts([]);
      }
    } catch {
      // Non-blocking pre-check — server enforces on submit
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const phone = watch("phone");
  const nid = watch("nid");

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
    setSubmitError(null);
    setFieldErrors({});

    if (duplicateConflicts.length > 0) {
      setSubmitError("Please fix the duplicate phone number or National ID before submitting.");
      return;
    }

    if (photoError) {
      setSubmitError("Please resolve the photo error first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("guardianName", data.guardianName);
      formData.append("phone", data.phone);
      if (data.email) formData.append("email", data.email);
      formData.append("nid", data.nid);
      formData.append("address", data.address);
      formData.append("dateOfBirth", data.dateOfBirth);
      if (data.occupation) formData.append("occupation", data.occupation);
      formData.append("requestedContributionType", data.requestedContributionType);
      formData.append("requestedContributionAmount", String(data.requestedContributionAmount));

      if (photoFile) {
        formData.append("file", photoFile);
      }

      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        const details = getApiErrorDetails(result);
        if (details) setFieldErrors(details);

        if (getApiErrorCode(result) === "DUPLICATE_ENTRY" && details) {
          const conflicts: DuplicateConflict[] = [];
          if (details.phone?.[0]) {
            conflicts.push({ field: "phone", status: "pending", message: details.phone[0] });
          }
          if (details.nid?.[0]) {
            conflicts.push({ field: "nid", status: "pending", message: details.nid[0] });
          }
          if (conflicts.length > 0) setDuplicateConflicts(conflicts);
        }

        setSubmitError(getApiErrorMessage(result, "Submission failed. Please try again."));
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
                if (phone && !errors.phone) checkDuplicate(phone, nid);
              }}
            />
            <FieldError message={errors.phone?.message ?? fieldErrors.phone?.[0]} />
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
                if (nid && !errors.nid) checkDuplicate(phone, nid);
              }}
            />
            <FieldError message={errors.nid?.message ?? fieldErrors.nid?.[0]} />
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

      {/* ── Duplicate block ── */}
      {duplicateConflicts.length > 0 && (
        <DuplicateWarningBanner conflicts={duplicateConflicts} />
      )}
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
          desc="Upload a recent passport-size photo (optional)"
        />

        <div className="flex flex-col sm:flex-row items-center gap-5 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors bg-card">
          <div
            onClick={() => photoInputRef.current?.click()}
            className="relative size-24 shrink-0 rounded-xl overflow-hidden bg-muted border border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors group"
          >
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Profile preview"
                fill
                className="object-cover animate-in fade-in duration-300"
              />
            ) : (
              <Upload className="size-6 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <p className="text-sm font-medium">Select passport-size photo</p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP. Recommended square aspect ratio, max 5 MB.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => photoInputRef.current?.click()}
              >
                {photoFile ? "Change Photo" : "Choose File"}
              </Button>
              {photoFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setPhotoError(null);
                    if (photoInputRef.current) photoInputRef.current.value = "";
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            {photoError && <p className="text-xs text-destructive mt-1.5">{photoError}</p>}
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
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
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || duplicateConflicts.length > 0}
          className="w-full sm:w-auto gap-2"
        >
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
