"use client";

import {
  ScrollText,
  BookOpen,
  CircleDollarSign,
  CalendarClock,
  Landmark,
  UserX,
  Handshake,
  PiggyBank,
  TrendingUp,
  BarChart3,
  Clock,
  Building2,
  Home,
  Heart,
  Gavel,
  ShieldCheck,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const corePrinciples = [
  {
    icon: CircleDollarSign,
    text: "রেজিস্ট্রেশন ফি ৩০০ টাকা (যা অফেরতযোগ্য)",
  },
  {
    icon: Users,
    text: "এই ফর্ম এ রেজিস্ট্রেশন এর জন্য শুধুমাত্র SSC Batch ২০১৫ এর সকল সদস্য আবেদন করতে পারবে।",
  },
];

const activities = [
  {
    icon: CalendarClock,
    text: "মাসিক ভিত্তিতে ফান্ড কালেকশন করা হবে।",
  },
  {
    icon: CircleDollarSign,
    text: "একজন প্রতি মাসে সর্বনিম্ন ৩০০ টাকা থেকে শুরু করে আনলিমিটেড পর্যন্ত টাকা জমা করতে পারবে।",
  },
  {
    icon: Landmark,
    text: "টাকা নিজ দায়িত্বে ক্যাশিয়ারের bKash বা ব্যাংক একাউন্টে বা ক্যাশ জমা দিতে হবে। (বিকাশে টাকা দিলে খরচ সহ দিতে হবে)",
  },
  {
    icon: UserX,
    text: "কোনও সদস্য পর পর ২ মাস টাকা না দিলে তার রেজিস্ট্রেশন বাতিল করা হবে। (কেও চাইলে মাস বা বছরের মোট টাকা একবারে অগ্রিম প্রদান করতে পারে)",
  },
  {
    icon: AlertTriangle,
    text: "কারোর রেজিস্ট্রেশন বাতিল হলে পরে রেজিস্ট্রেশন করতে গেলে তাঁকে জরিমানা সহ নির্দিষ্ট সময় পর আবার নতুন করে রেজিস্ট্রেশন করতে হবে।",
  },
  {
    icon: ShieldCheck,
    text: "নির্দিষ্ট সময় পর্যন্ত ফান্ড কালেকশন করা হবে এবং এই সময়ের মধ্যে কেও চাইলেই টাকা তুলে নিতে পারবে না।",
  },
  {
    icon: Handshake,
    text: "সদস্যগণ ফাউন্ডেশন থেকে যুক্তিসঙ্গত কারণে ২ জন গ্যারান্টার সহ নির্দিষ্ট পরিমাণ অর্থ নির্দিষ্ট সময়ের জন্য ধার হিসেবে নিতে পারবে।",
  },
  {
    icon: Heart,
    text: "এই ধার নেওয়া টাকা, ফাউন্ডেশন এ ফেরত দেবার সময়, কোনও প্রকার অতিরিক্ত কোনও টাকা দেওয়া লাগবে না।",
  },
  {
    icon: TrendingUp,
    text: "নির্দিষ্ট সময় পরে আমাদের ফান্ডের উত্তোলনকৃত টাকা আমরা কোনো ব্যবসায়িক কার্যক্রমে বিনিয়োগ করবো।",
  },
  {
    icon: BarChart3,
    text: "বিনিয়োগকৃত অর্থের লভ্যাংশ বা ক্ষতি সদস্যের মধ্যে বণ্টন করা হবে।",
  },
  {
    icon: Clock,
    text: "আমাদের ১ম বিনিয়োগে যেতে ১/২ বছর সময় লাগতে পারে, সেক্ষেত্রে রেজিষ্ট্রেশনকৃত সকল সদস্যের এই মেয়াদ পর্যন্ত অংশগ্রহণ বাধ্যতামূলক।",
  },
  {
    icon: Building2,
    text: "বিনিয়োগকৃত অর্থ হতে লাভ হলে, ফাউন্ডেশন এর দৈনিক কার্যক্রম এবং সামাজিক উন্নয়নমূলক কাজের জন্য নির্দিষ্ট অংশ কর্তন করা হবে।",
  },
  {
    icon: PiggyBank,
    text: "নির্দিষ্ট সময় পর কেও তার নিজের জমানো টাকা ফেরত নিতে চাইলে তাঁর থেকে বিভিন্ন কাজের জন্য নির্দিষ্ট পরিমাণ অর্থ কর্তন করা হবে। (কেও বিপদে পড়লে ফাউন্ডেশন তাঁকে হেল্প করবে)",
  },
  {
    icon: Home,
    text: "ফাউন্ডেশন এর কার্যক্রম এর জন্য যে ঘর তৈরি করা হয়েছে, সেটা ব্যবহারের জন্য সম্পূর্ণ খরচ ফাউন্ডেশন সহ সকলে বহন করবে।",
  },
  {
    icon: Heart,
    text: "সবাই আমরা বিনয়ের সাথে অংশগ্রহণ করবো, সর্বোপরি আমরা সকলেই বন্ধু। সবাই আমরা সহমর্মিতা দেখাবো। যে কোনও সমস্যা হলে কমিটি তার সমাধান করবে।",
  },
  {
    icon: Gavel,
    text: "যে কোনও বিষয়ে কমিটির সিদ্ধান্তই চূড়ান্ত বলে গণ্য হবে।",
  },
];

export default function PrinciplesSection() {
  return (
    <section className="py-24 bg-muted/20 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        {/* ─── Section Header ─── */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            <ScrollText className="size-3 mr-1.5" />
            নীতিমালা
          </Badge>
          <h2 className="font-bold tracking-tight text-3xl">
            আমাদের মূলনীতি ও কার্যক্রম
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            ফাউন্ডেশনের সুশৃঙ্খল পরিচালনার জন্য নিম্নোক্ত নীতিমালা প্রণয়ন করা হয়েছে। প্রতিটি
            সদস্যের জন্য এই নীতিমালা মেনে চলা বাধ্যতামূলক।
          </p>
        </div>

        {/* ─── Core Principles ─── */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-4.5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">মূলনীতি</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {corePrinciples.map((item, idx) => (
              <div
                key={idx}
                className="group relative flex gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5"
              >
                {/* Icon pill */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="size-5 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 pt-2">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Activities / কার্যক্রম ─── */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <ScrollText className="size-4.5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">ফাউন্ডেশন এর কার্যক্রম</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {activities.map((item, idx) => (
              <div
                key={idx}
                className="group relative flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
              >
                {/* Number badge */}
                <div className="absolute top-3 right-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Icon */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="size-5 text-primary" />
                </div>

                {/* Text */}
                <p className="text-sm leading-relaxed text-muted-foreground pr-6 pt-2">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
