import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import ApplicationForm from "@/features/applications/ApplicationForm";

export const metadata = {
  title: "Become a Member — SSC-2015 Foundation",
  description:
    "Apply to join the SSC-2015 Foundation. Fill out the membership application form and start contributing to our community.",
};

export default function BecomeMemberPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* ── Page header ── */}
      <div className="bg-foreground py-16">
        <div className="mx-auto max-w-7xl px-6">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-xs tracking-widest uppercase">
            Open Enrollment
          </Badge>
          <div className="flex items-start gap-5">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/20 shrink-0">
              <ClipboardList className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-background">Become a Member</h1>
              <p className="mt-3 text-background/70 max-w-xl leading-relaxed">
                Fill out the form below to apply for membership in the SSC-2015 Foundation. Your
                application will be reviewed by an admin and you will be notified upon approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form content ── */}
      <div className="mx-auto max-w-7xl px-6 mt-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Sidebar info */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h3 className="font-semibold">What happens next?</h3>
              <ol className="space-y-4">
                {[
                  {
                    n: "1",
                    title: "Application Received",
                    desc: "Your application is saved and marked as pending.",
                  },
                  {
                    n: "2",
                    title: "Admin Review",
                    desc: "An admin will review your details — usually within a few days.",
                  },
                  {
                    n: "3",
                    title: "Approval & Onboarding",
                    desc: "Once approved, you'll be assigned a member code and can start contributing.",
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {step.n}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-muted/50 rounded-2xl border border-border p-6 space-y-2">
              <h4 className="font-medium text-sm">Documents to keep ready</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• National ID (NID) number</li>
                <li>• Father / Guardian full name</li>
                <li>• Home address (village/union/district)</li>
                <li>• Contact phone number</li>
              </ul>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <ApplicationForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
