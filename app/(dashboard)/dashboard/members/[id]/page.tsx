"use client";

import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

import MemberDetailClient from "@/features/members/MemberDetailClient";
import {
  useFetchMemberById,
  useFetchMemberContributions,
} from "@/features/members/hook/memberHooks";

export default function MemberDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    data: member,
    isLoading: isMemberLoading,
    isError: isMemberError,
    error: memberError,
  } = useFetchMemberById(id);

  const {
    data: contributions,
    isLoading: isContributionsLoading,
    isError: isContributionsError,
    error: contributionsError,
  } = useFetchMemberContributions(id);

  const loading = isMemberLoading || isContributionsLoading;
  const isError = isMemberError || isContributionsError;
  const error = memberError || contributionsError;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading member record…</p>
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
        <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Failed to load member record</p>
        <p className="text-xs text-destructive/80 mt-1">
          {error instanceof Error ? error.message : "Record not found or network error occurred."}
        </p>
      </div>
    );
  }

  return <MemberDetailClient member={member} contributions={contributions ?? []} />;
}
