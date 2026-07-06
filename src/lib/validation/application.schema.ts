import { z } from "zod";

import { phoneSchema, emailSchema } from "@/lib/validation/common.schema";

/**
 * Zod v4 schema for the public Membership Application form.
 * Note: Zod v4 uses `error` instead of `required_error`/`invalid_type_error`.
 * Shared between the client (react-hook-form resolver) and the API route.
 */
export const ApplicationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name is too long")
    .trim(),

  guardianName: z
    .string()
    .min(2, "Guardian name must be at least 2 characters")
    .max(150, "Guardian name is too long")
    .trim(),

  phone: phoneSchema,

  email: emailSchema.optional().or(z.literal("")),

  nid: z.string().min(5, "NID is too short").max(30, "NID is too long").trim(),

  address: z.string().min(5, "Address is too short").max(500, "Address is too long").trim(),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
    .refine(
      (val) => {
        const dob = new Date(val);
        const minAge = new Date();
        minAge.setFullYear(minAge.getFullYear() - 10);
        return dob < minAge;
      },
      { message: "Must be at least 10 years old" },
    ),

  occupation: z.string().max(100).trim().optional().or(z.literal("")),

  requestedContributionType: z.enum(["weekly", "monthly"]),

  photoUrl: z.string().optional(),

  // Use z.number() with preprocess so the form type is `number` (not `unknown`)
  requestedContributionAmount: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z
      .number({ error: "Amount is required" })
      .min(1, "Amount must be at least 1")
      .max(1_000_000, "Amount is too large"),
  ),
});

export type ApplicationFormData = z.infer<typeof ApplicationSchema>;
