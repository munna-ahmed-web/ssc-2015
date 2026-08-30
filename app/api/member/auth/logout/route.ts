import { COOKIE_MEMBER } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/** POST /api/member/auth/logout — clears the member session cookie. */
export async function POST() {
  try {
    const res = apiSuccess(null, { message: "Logged out." });
    res.cookies.set(COOKIE_MEMBER, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return handleRouteError(err, "[POST /api/member/auth/logout]");
  }
}
