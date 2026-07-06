import { notFound } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Briefcase, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { connectDB } from "@/lib/db";
import { MembershipApplication } from "@/models";
import type { IMembershipApplication, ApplicationStatus } from "@/models";
import ApplicationStatusBadge from "@/features/applications/ApplicationStatusBadge";
import ApplicationActions from "@/features/applications/ApplicationActions";

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getApplication(id: string): Promise<IMembershipApplication | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const app = await MembershipApplication.findById(id).lean();
  return app as unknown as IMembershipApplication | null;
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const app = await getApplication(id);
  return {
    title: app ? `${app.fullName} — Application` : "Application Not Found",
  };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();

  const appId = (app._id as { toString(): string }).toString();
  const status = app.status as ApplicationStatus;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/dashboard/applications">
            <ArrowLeft className="size-4" />
            Applications
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h2 className="text-lg">{app.fullName}</h2>
        <ApplicationStatusBadge status={status} />
      </div>

      {/* Action panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationActions applicationId={appId} status={status} />
          {app.reviewedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Reviewed on {new Date(app.reviewedAt).toLocaleString("en-BD")}
            </p>
          )}
          {app.rejectionReason && (
            <div className="mt-3 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
              <span className="font-medium text-red-700 dark:text-red-400">Reason: </span>
              <span className="text-red-700 dark:text-red-300">{app.rejectionReason}</span>
            </div>
          )}
          {app.memberId && (
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/members/${app.memberId.toString()}`}>
                  View Member Record
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={User} label="Full Name" value={app.fullName} />
            <InfoRow icon={User} label="Father / Guardian" value={app.guardianName} />
            <InfoRow icon={Phone} label="Phone" value={app.phone} />
            <InfoRow icon={Mail} label="Email" value={app.email} />
            <InfoRow icon={CreditCard} label="National ID (NID)" value={app.nid} />
            <InfoRow
              icon={Calendar}
              label="Date of Birth"
              value={app.dateOfBirth
                ? new Date(app.dateOfBirth).toLocaleDateString("en-BD", { dateStyle: "long" })
                : undefined}
            />
            <InfoRow icon={Briefcase} label="Occupation" value={app.occupation} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {app.photoUrl && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Applicant Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                <div className="size-32 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={app.photoUrl}
                    alt={app.fullName}
                    className="size-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow icon={MapPin} label="Address" value={app.address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Contribution Preference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={Banknote}
                label="Type"
                value={app.requestedContributionType}
              />
              <InfoRow
                icon={Banknote}
                label="Requested Amount"
                value={`৳${app.requestedContributionAmount.toLocaleString()}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Submission Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span>
                  {new Date((app as unknown as { createdAt: Date }).createdAt).toLocaleDateString(
                    "en-BD",
                    { dateStyle: "medium" }
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Photo</span>
                <Badge variant="outline" className="text-xs">
                  {app.photoUrl ? "Uploaded" : "Not provided"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
