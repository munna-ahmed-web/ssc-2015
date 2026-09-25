import type { NextRequest } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { apiError, apiSuccess, apiValidationError, handleRouteError } from "@/lib/api/response";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(200, "New password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

/**
 * POST /api/auth/change-password — admin changes their OWN password.
 *
 * Requires the current password (so a stolen session cannot silently lock the
 * real owner out). Admins cannot change each other's passwords here.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const parsed = ChangePasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const user = await User.findById(admin.sub).select("+password");
    if (!user) {
      return apiError("NOT_FOUND", "Account not found.", 404);
    }

    const valid = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!valid) {
      return apiError("UNAUTHORIZED", "Your current password is incorrect.", 401);
    }

    user.password = await hashPassword(parsed.data.newPassword);
    await user.save();

    return apiSuccess(null, { message: "Password changed successfully." });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/auth/change-password]");
  }
}
