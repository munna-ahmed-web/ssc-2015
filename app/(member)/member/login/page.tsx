"use client";

import { useState } from "react";
import { Loader2, Mail, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequestLoginLink } from "@/features/member-portal/hook/memberPortalHooks";

export default function MemberLoginPage() {
  const { mutateAsync: requestLink, isPending } = useRequestLoginLink();

  const [identifier, setIdentifier] = useState("");
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const message = await requestLink(identifier.trim());
      setSentMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (sentMessage) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <MailCheck className="size-7 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-muted-foreground">{sentMessage}</p>
            <p className="text-xs text-muted-foreground">
              The link works once and expires in 15 minutes. Don&apos;t forget the spam folder.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSentMessage(null);
                setIdentifier("");
              }}
            >
              Use a different phone or email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Member Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your phone number or email. We&apos;ll send a login link to your registered email
            — no password needed.
          </p>
        </CardHeader>
        <CardContent>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Phone number or email</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="01XXXXXXXXX or you@example.com"
                autoComplete="username"
              />
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isPending || !identifier.trim()}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Sending…" : "Send Login Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
