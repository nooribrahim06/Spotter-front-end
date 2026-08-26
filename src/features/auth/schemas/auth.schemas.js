import * as z from "zod";

/**
 * Spotter — Frontend Validation Schemas (Zod v4)
 *
 * These mirror the backend validation rules for UX purposes.
 * The backend remains the authority — these are client-side only.
 *
 * Import style: import * as z from "zod" (required for Zod v4 + RHF)
 */

export const signupSchema = z.object({
  email: z.email("Please enter a valid email address"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const resendVerificationSchema = z.object({
  email: z.email("Please enter a valid email address"),
});
