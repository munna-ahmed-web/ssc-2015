import { clearAuthCookies } from "@/lib/auth";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  const res = apiSuccess({}, { message: "Logged out successfully." });
  clearAuthCookies(res);
  return res;
}
