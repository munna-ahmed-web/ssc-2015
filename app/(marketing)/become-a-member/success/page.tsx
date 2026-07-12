"use client";

/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-nested-ternary */

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Home,
  Copy,
  Check,
  Smartphone,
  AlertTriangle,
  Banknote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAYMENT_NUMBER = "01745412386";
const REGISTRATION_FEE = "৳৩০০";

export default function SuccessPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = PAYMENT_NUMBER;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center px-6">
      <div className="max-w-xl w-full">
        {/* ── Success Header ── */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-500/10 ring-4 ring-green-500/5">
            <CheckCircle2 className="size-10 text-green-500" strokeWidth={1.5} />
          </div>
          <h1 className="mb-3 text-2xl sm:text-3xl font-bold">আবেদন সফলভাবে জমা হয়েছে!</h1>
          <p className="text-muted-foreground leading-relaxed">
            <strong>SSC-2015 Foundation</strong>-এ আপনার সদস্যপদের আবেদন গৃহীত হয়েছে। আবেদন
            সম্পূর্ণ করতে নিচের ধাপ অনুসরণ করুন।
          </p>
        </div>

        {/* ── Payment Card (Primary CTA) ── */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.03] p-6 sm:p-8 mb-6">
          {/* Decorative corner glow */}
          <div className="absolute -top-12 -right-12 size-32 rounded-full bg-primary/10 blur-2xl" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
                <Banknote className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">রেজিস্ট্রেশন ফি প্রদান করুন</h2>
                <p className="text-xs text-muted-foreground">আবেদন নিশ্চিত করতে ফি পাঠান</p>
              </div>
            </div>

            {/* Fee amount */}
            <div className="flex items-center justify-center gap-3 mb-6 py-4 rounded-xl bg-card border border-border">
              <span className="text-sm text-muted-foreground">রেজিস্ট্রেশন ফি</span>
              <span className="text-3xl font-bold text-primary">{REGISTRATION_FEE}</span>
              <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">
                অফেরতযোগ্য
              </Badge>
            </div>

            {/* Payment number */}
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
              পেমেন্ট নম্বর (bKash / Nagad)
            </p>
            <button
              onClick={handleCopy}
              className="group w-full flex items-center justify-between gap-3 rounded-xl bg-card border-2 border-dashed border-primary/30 hover:border-primary/60 px-5 py-4 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-primary" />
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-widest text-foreground">
                  {PAYMENT_NUMBER}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                {copied ? (
                  <>
                    <Check className="size-4" />
                    কপি হয়েছে!
                  </>
                ) : (
                  <>
                    <Copy className="size-4 group-hover:scale-110 transition-transform" />
                    কপি করুন
                  </>
                )}
              </div>
            </button>

            {/* Payment methods */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="flex items-center gap-3 rounded-xl bg-[#E2136E]/5 border border-[#E2136E]/20 px-4 py-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#E2136E]/10">
                  <span className="text-sm font-bold text-[#E2136E]">b</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#E2136E]">bKash</p>
                  <p className="text-[10px] text-muted-foreground">Send Money</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[#F6921E]/5 border border-[#F6921E]/20 px-4 py-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#F6921E]/10">
                  <span className="text-sm font-bold text-[#F6921E]">N</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F6921E]">Nagad</p>
                  <p className="text-[10px] text-muted-foreground">Send Money</p>
                </div>
              </div>
            </div>

            {/* Important note */}
            <div className="mt-5 flex gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
              <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  গুরুত্বপূর্ণ নির্দেশনা
                </p>
                <ul className="space-y-1">
                  <li>
                    • টাকা পাঠানোর পর <strong>Transaction ID</strong> সংরক্ষণ করুন
                  </li>
                  <li>
                    • bKash-এ টাকা পাঠালে <strong>চার্জ সহ</strong> পাঠাতে হবে
                  </li>
                  <li>
                    • রেজিস্ট্রেশন ফি <strong>অফেরতযোগ্য</strong>
                  </li>
                  <li>• ফি প্রদান ছাড়া সদস্যপদ নিশ্চিত হবে না</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── Steps / Progress ── */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-center mb-5">পরবর্তী ধাপসমূহ</h3>
          <div className="space-y-4">
            {[
              { step: "✓", label: "আবেদন জমা হয়েছে", sublabel: "সম্পন্ন", done: true },
              {
                step: "2",
                label: "রেজিস্ট্রেশন ফি প্রদান করুন",
                sublabel: `${REGISTRATION_FEE} bKash/Nagad-এ পাঠান`,
                done: false,
                active: true,
              },
              {
                step: "3",
                label: "অ্যাডমিন রিভিউ",
                sublabel: "আপনার আবেদন ও পেমেন্ট যাচাই করা হবে",
                done: false,
              },
              {
                step: "4",
                label: "সদস্যপদ নিশ্চিত",
                sublabel: "অনুমোদনের পর আপনি সদস্য হিসেবে যুক্ত হবেন",
                done: false,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    item.done
                      ? "bg-green-500 text-white"
                      : item.active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.step}
                </span>
                <div className="pt-0.5">
                  <p
                    className={`text-sm ${
                      item.done
                        ? "text-foreground font-medium line-through opacity-60"
                        : item.active
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="size-4" />
              হোম পেজে যান
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/become-a-member">
              নতুন আবেদন করুন <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
