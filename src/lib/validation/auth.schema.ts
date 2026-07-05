import { z } from "zod";

import { emailSchema, passwordSchema } from "./common.schema";

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name too short").trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});
