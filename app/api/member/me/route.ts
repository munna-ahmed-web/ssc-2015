import { connectDB } from "@/lib/db";
import { Member } from "@/models";
import { requireMember } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/member/me — member session required.
 * Returns the logged-in member's own profile summary (read-only subset).
 */
export async function GET() {
  try {
    const session = await requireMember();
    await connectDB();

    const member = await Member.findById(session.sub)
      .select(
        "fullName memberCode photoUrl contributionType contributionAmount status joinedAt guardianName phone",
      )
      .lean();
    if (!member) {
      return apiError("UNAUTHORIZED", "Member account not found.", 401);
    }

    return apiSuccess(member);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/member/me]");
  }
}
