"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  CreditCard,
  Banknote,
  Edit2,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPeriodLabel } from "@/lib/periods";

import type { SerializedMember, SerializedContribution } from "./types/types";
import MemberStatusBadge from "./MemberStatusBadge";
import MemberStatusActions from "./MemberStatusActions";
import EditMemberModal from "./EditMemberModal";

// ─── Info row helper ──────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value ?? "—"}</p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MemberDetailClientProps {
  member: SerializedMember;
  contributions: SerializedContribution[];
}

export default function MemberDetailClient({ member, contributions }: MemberDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);
  const status = member.status;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button & Title Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/dashboard/members">
            <ArrowLeft className="size-4" />
            Members
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h2 className="text-lg">{member.fullName}</h2>
        <Badge variant="outline" className="text-xs font-semibold">
          {member.memberCode}
        </Badge>
        <MemberStatusBadge status={status} />
      </div>

      {/* Profile actions & edits */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Status controls */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Membership Lifecycle Controls
            </CardTitle>
            <Button
              size="xs"
              variant="outline"
              className="gap-1.5"
              onClick={() => setEditOpen(true)}
            >
              <Edit2 className="size-3" />
              Edit Profile
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <MemberStatusActions memberId={member._id} currentStatus={status} />

            {/* Lifecycle markers */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
              <div>
                Joined At:{" "}
                <span className="font-medium text-foreground">
                  {new Date(member.joinedAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}
                </span>
              </div>
              {member.suspendedAt && (
                <div>
                  Suspended At:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(member.suspendedAt).toLocaleDateString("en-BD", {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>
              )}
              {member.exitedAt && (
                <div>
                  Exited At:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(member.exitedAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contribution plan summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contribution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Banknote} label="Frequency" value={member.contributionType} />
            <InfoRow
              icon={Banknote}
              label="Standard Amount"
              value={`৳${member.contributionAmount.toLocaleString()}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Details layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Cards */}
        <Card className="md:col-span-2 space-y-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Profile Record Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={User} label="Guardian / Father" value={member.guardianName} />
            <InfoRow icon={Phone} label="Phone" value={member.phone} />
            <InfoRow icon={Mail} label="Email Address" value={member.email} />
            <InfoRow icon={CreditCard} label="National ID (NID)" value={member.nid} />
            <InfoRow
              icon={Calendar}
              label="Date of Birth"
              value={
                member.dateOfBirth
                  ? new Date(member.dateOfBirth).toLocaleDateString("en-BD", { dateStyle: "long" })
                  : undefined
              }
            />
            <InfoRow icon={Briefcase} label="Occupation" value={member.occupation} />
            <div className="sm:col-span-2">
              <InfoRow icon={MapPin} label="Home Address" value={member.address} />
            </div>
          </CardContent>
        </Card>

        {/* Avatar Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Member Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <div className="size-32 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photoUrl}
                  alt={member.fullName}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-16 text-muted-foreground/30" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger History section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contribution Ledger History
          </CardTitle>
          <span className="text-xs text-muted-foreground">{contributions.length} entries</span>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <CalendarDays className="size-8 opacity-40 mb-2" />
              <p className="text-sm font-medium">No contributions recorded yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Period", "Amount", "Type", "Paid On", "Notes"].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {contributions.map((contrib) => {
                      return (
                        <tr
                          key={contrib._id}
                          className={`hover:bg-muted/30 transition-colors ${contrib.isReversal ? "opacity-60" : ""}`}
                        >
                          <td className="px-4 py-3">
                            {formatPeriodLabel(contrib.periodLabel)}
                            {contrib.isReversal && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs text-red-500 border-red-300"
                              >
                                Reversal
                              </Badge>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${contrib.isReversal ? "text-red-600 dark:text-red-400" : ""}`}
                          >
                            {contrib.isReversal ? "−" : ""}৳{contrib.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs capitalize">
                              {contrib.contributionType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(contrib.paidAt).toLocaleDateString("en-BD")}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-40">
                            {contrib.notes ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditMemberModal member={member} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
