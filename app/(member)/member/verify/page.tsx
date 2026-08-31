"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVerifyLoginToken } from "@/features/member-portal/hook/memberPortalHooks";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { mutate: verify } = useVerifyLoginToken();
  const [error, setError] = useState<string | null>(null);

  // Guard: the token is single-use, so the verify call must fire exactly once
  // (React StrictMode double-runs effects in dev).
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;

    verify(token, {
      onSuccess: () => {
        router.replace("/member/statistics");
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "This login link is invalid or has expired.");
      },
    });
  }, [token, verify, router]);

  // Missing token is knowable at render time — no state needed
  const displayError = !token ? "This login link is incomplete. Please request a new one." : error;

  if (displayError) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <AlertCircle className="size-10 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Link not valid</h2>
            <p className="text-sm text-muted-foreground">{displayError}</p>
            <Button asChild>
              <Link href="/member/login">Request a new link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3">
      <Loader2 className="size-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Verifying your login link…</p>
    </div>
  );
}

export default function MemberVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
