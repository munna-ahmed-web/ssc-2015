import { z } from "zod";

export const emailSchema = z.email("Invalid email").toLowerCase().trim();

export const passwordSchema = z
  .string()
  .min(8, { error: "Min 8 characters" })
  .regex(/[A-Z]/, { error: "Must contain an uppercase letter" })
  .regex(/\d/, { error: "Must contain a number" });

export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s-()]/g, ""))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, { message: "Invalid phone number" }));

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
