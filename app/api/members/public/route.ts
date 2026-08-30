import { connectDB } from "@/lib/db";
import { Member } from "@/models";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/members/public — no auth (consumed by the public home page).
 *
 * Privacy: exposes ONLY fullName, photoUrl, and joinedAt for active members
 * who have not opted out (`showOnWebsite`). Never expose phone, NID, address,
 * or contribution data here.
 */
export async function GET() {
  try {
    await connectDB();

    const members = await Member.find({ status: "active", showOnWebsite: { $ne: false } })
      .select("fullName photoUrl joinedAt")
      .sort({ joinedAt: 1 })
      .lean();

    return apiSuccess(members);
  } catch (err) {
    return handleRouteError(err, "[GET /api/members/public]");
  }
}
