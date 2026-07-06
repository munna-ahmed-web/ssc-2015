import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return apiError("UNAUTHORIZED", "Unauthorized.", 401);
  }

  try {
    await connectDB();
    const user = await User.findById(session.sub).select("name email role").lean();
    if (!user) {
      return apiError("NOT_FOUND", "User not found.", 404);
    }

    return apiSuccess({
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return handleRouteError(err, "[GET /api/auth/me]");
  }
}
