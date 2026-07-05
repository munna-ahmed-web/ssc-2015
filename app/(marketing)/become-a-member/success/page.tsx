import Link from "next/link";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Application Submitted — SSC-2015 Foundation",
  description: "Your membership application has been successfully submitted.",
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="mx-auto mb-8 flex size-24 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-12 text-primary" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="mb-4">Application Submitted!</h1>

        <p className="text-muted-foreground leading-relaxed mb-3">
          Thank you for applying to the <strong>SSC-2015 Foundation</strong>. Your membership
          application has been received and is now pending review.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-10">
          An admin will review your application shortly. Please be patient — you&apos;ll be
          onboarded once your application is approved.
        </p>

        {/* Steps reminder */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-10 text-left space-y-4">
          <h3 className="text-sm font-semibold text-center mb-4">What happens next</h3>
          {[
            { step: "✓", label: "Application received", done: true },
            { step: "2", label: "Admin reviews your details", done: false },
            { step: "3", label: "You're approved & onboarded", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  item.done
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {item.step}
              </span>
              <span
                className={`text-sm ${item.done ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="size-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/become-a-member">
              Submit Another Application <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
