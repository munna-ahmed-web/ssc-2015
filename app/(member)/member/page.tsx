import { redirect } from "next/navigation";

/** /member is an entry point only — the portal lives at /member/statistics. */
export default function MemberIndexPage() {
  redirect("/member/statistics");
}
