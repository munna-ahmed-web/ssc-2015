"use client";

/* eslint-disable @typescript-eslint/no-misused-promises */

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Heart, Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api/response";
import { setClientTokens } from "@/lib/auth/client-tokens";

// ─── Schema (client-only version — no lowercase/trim transforms needed) ────────

const LoginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormData = z.infer<typeof LoginFormSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(LoginFormSchema) as any,
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setServerError(getApiErrorMessage(result, "Login failed. Please try again."));
        return;
      }

      if (result.data?.accessToken && result.data?.refreshToken) {
        setClientTokens(result.data.accessToken, result.data.refreshToken, {
          expiresIn: result.data.expiresIn,
          refreshExpiresIn: result.data.refreshExpiresIn,
        });
      }

      router.push(from);
      router.refresh(); // Force layout re-render with new cookie
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/25">
            <Heart className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-center">SSC-2015 Foundation</h1>
          <p className="text-muted-foreground text-sm mt-1">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          <h2 className="text-lg font-semibold mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your admin credentials to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  aria-invalid={!!errors.email}
                  className={`pl-9 ${errors.email ? "border-destructive" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className={`pl-9 pr-10 ${errors.password ? "border-destructive" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Foundation Management System · Admin only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-sm flex flex-col items-center justify-center">
            <Loader2 className="size-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground mt-2">Loading sign in...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
