"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowRight, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFetchPublicMembers } from "@/features/members/hook/memberHooks";
import type { PublicMember } from "@/features/members/types/types";

// Deterministic pastel background per name for the initials fallback avatar
const AVATAR_TINTS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
] as const;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function tintOf(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function MemberCard({ member }: { member: PublicMember }) {
  const joinedYear = new Date(member.joinedAt).getFullYear();

  return (
    <div className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
      {member.photoUrl ? (
        <div className="relative size-20 rounded-full overflow-hidden border border-border">
          <Image
            src={member.photoUrl}
            alt={member.fullName}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className={`flex size-20 items-center justify-center rounded-full text-xl font-bold font-heading ${tintOf(member.fullName)}`}
        >
          {initialsOf(member.fullName)}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-foreground">{member.fullName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Member since {joinedYear}</p>
      </div>
    </div>
  );
}

export default function MembersSection() {
  const { data: members = [], isLoading } = useFetchPublicMembers();

  if (isLoading) {
    return (
      <section className="py-20 bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-6 text-center space-y-4">
          <Loader2 className="size-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading members…</p>
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null; // Don't show the section until there are members to display
  }

  return (
    <section id="members" className="py-24 bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20">
            <Users className="size-3 mr-1" />
            Our Members
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The people behind the foundation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {members.length} members of the SSC-2015 batch, contributing together for our community.
          </p>
        </div>

        {/* Members grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {members.map((member) => (
            <MemberCard key={member._id} member={member} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to see your face here? Join us and be part of something meaningful.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/become-a-member">
              Become a Member
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
