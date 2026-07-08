import type { NextRequest } from "next/server";

import { getDashboardStats } from "@/lib/dashboard";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const stats = await getDashboardStats();
    return apiSuccess(stats);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/dashboard]");
  }
}
