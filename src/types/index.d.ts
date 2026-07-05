import type { z } from "zod";

import type { LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema";
import type { UserProfileSchema } from "@/lib/validations/user.schema";

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Locale = "en" | "bn" | "fr";
