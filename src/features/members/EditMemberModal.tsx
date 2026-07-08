/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { z } from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUpdateMember } from "./hook/memberHooks";
import type { SerializedMember } from "./types/types";

// ─── Validation Schema ────────────────────────────────────────────────────────

const EditMemberSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").trim(),
  guardianName: z.string().min(2, "Guardian name must be at least 2 characters").trim(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone format"),
  email: z.string().email("Invalid email").or(z.literal("")),
  nid: z.string().min(5, "NID must be at least 5 characters").trim(),
  address: z.string().min(5, "Address must be at least 5 characters").trim(),
  dateOfBirth: z.string().min(10, "Invalid Date format (YYYY-MM-DD)"),
  occupation: z.string().trim().optional(),
  photoUrl: z.string().url("Invalid image URL").or(z.literal("")),
  contributionType: z.enum(["weekly", "monthly"]),
  contributionAmount: z.coerce.number().min(1, "Amount must be at least 1"),
});

type EditMemberFormData = z.infer<typeof EditMemberSchema>;

interface EditMemberModalProps {
  member: SerializedMember;
  open: boolean;
  onClose: () => void;
}

export default function EditMemberModal({ member, open, onClose }: EditMemberModalProps) {
  const router = useRouter();
  const { mutateAsync: updateMember, isPending: updating } = useUpdateMember();
  const [error, setError] = useState<string | null>(null);

  // Formatted date string for input: YYYY-MM-DD
  const formatDOB = (dateValue: unknown) => {
    if (!dateValue) return "";
    const d = new Date(String(dateValue));
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditMemberFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(EditMemberSchema) as any,
    defaultValues: {
      fullName: member.fullName,
      guardianName: member.guardianName,
      phone: member.phone,
      email: member.email ?? "",
      nid: member.nid,
      address: member.address,
      dateOfBirth: formatDOB(member.dateOfBirth),
      occupation: member.occupation ?? "",
      photoUrl: member.photoUrl ?? "",
      contributionType: member.contributionType,
      contributionAmount: member.contributionAmount,
    },
  });

  const contributionTypeValue = watch("contributionType");
  const submitting = isSubmitting || updating;

  const onSubmit = async (data: EditMemberFormData) => {
    setError(null);
    try {
      await updateMember({
        id: member._id.toString(),
        data: data as Partial<SerializedMember>,
      });

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2" noValidate>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Personal Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Personal Details
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="guardianName">Father / Guardian *</Label>
                <Input id="guardianName" {...register("guardianName")} />
                {errors.guardianName && (
                  <p className="text-xs text-destructive">{errors.guardianName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nid">National ID (NID) *</Label>
                <Input id="nid" {...register("nid")} />
                {errors.nid && <p className="text-xs text-destructive">{errors.nid.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                {errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" {...register("occupation")} />
                {errors.occupation && (
                  <p className="text-xs text-destructive">{errors.occupation.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea id="address" rows={2} {...register("address")} />
                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contribution Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contribution Settings
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contributionType">Payment Frequency *</Label>
                <Select
                  value={contributionTypeValue}
                  onValueChange={(v) => setValue("contributionType", v as "weekly" | "monthly")}
                >
                  <SelectTrigger id="contributionType">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {errors.contributionType && (
                  <p className="text-xs text-destructive">{errors.contributionType.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contributionAmount">Amount (BDT) *</Label>
                <Input id="contributionAmount" type="number" {...register("contributionAmount")} />
                {errors.contributionAmount && (
                  <p className="text-xs text-destructive">{errors.contributionAmount.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="photoUrl">Photo URL</Label>
                <Input id="photoUrl" placeholder="https://..." {...register("photoUrl")} />
                {errors.photoUrl && (
                  <p className="text-xs text-destructive">{errors.photoUrl.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
