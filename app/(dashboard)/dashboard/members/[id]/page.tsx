import { notFound } from "next/navigation";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { Member, Contribution } from "@/models";
import MemberDetailClient from "@/features/members/MemberDetailClient";

async function getMemberWithHistory(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();

  const [member, contributions] = await Promise.all([
    Member.findById(id).lean(),
    Contribution.find({ memberId: new mongoose.Types.ObjectId(id) })
      .sort({ paidAt: -1 })
      .lean(),
  ]);

  if (!member) return null;

  // Serialize member fields
  const serializedMember = {
    ...member,
    _id: member._id.toString(),
    applicationId: member.applicationId?.toString(),
    memberId: member.memberId?.toString(),
    approvedBy: member.approvedBy?.toString(),
    dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString() : undefined,
    joinedAt: member.joinedAt.toISOString(),
    suspendedAt: member.suspendedAt?.toISOString(),
    exitedAt: member.exitedAt?.toISOString(),
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };

  // Serialize contributions list
  const serializedContributions = contributions.map((c) => ({
    ...c,
    _id: c._id.toString(),
    memberId: c.memberId.toString(),
    reversalOf: c.reversalOf?.toString(),
    recordedBy: c.recordedBy.toString(),
    paidAt: c.paidAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return {
    member: serializedMember as any,
    contributions: serializedContributions as any[],
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getMemberWithHistory(id);
  return {
    title: result ? `${result.member.fullName} — Member Record` : "Member Not Found",
  };
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getMemberWithHistory(id);

  if (!result) notFound();

  return <MemberDetailClient member={result.member} contributions={result.contributions} />;
}
