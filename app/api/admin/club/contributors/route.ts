import type { NextRequest } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { ClubContributor } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { apiSuccess, apiValidationError, handleRouteError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
    const filter = includeInactive ? {} : { isActive: true };

    const contributors = await ClubContributor.find(filter).sort({ name: 1 }).lean();
    return apiSuccess(contributors);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/club/contributors]");
  }
}

const CreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150).trim(),
  phone: z.string().max(30).trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const contributor = await ClubContributor.create({
      name: parsed.data.name,
      phone: parsed.data.phone,
      isActive: true,
    });

    await logActivity({
      actorId: admin.sub,
      action: "club.contributor_add",
      entityType: "club",
      entityId: String(contributor._id),
      entityLabel: contributor.name,
    });

    return apiSuccess(contributor, { message: "Contributor added.", status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/admin/club/contributors]");
  }
}
