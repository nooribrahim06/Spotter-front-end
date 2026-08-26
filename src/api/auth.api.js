import { apiClient, refreshClient } from "./apiClient.js";

/**
 * Spotter — Auth API Functions
 *
 * Components call these functions, never raw Axios methods.
 * Each function returns the Axios response or throws a normalized error.
 */

/**
 * POST /api/auth/signup
 * Creates a new account. Does NOT log the user in.
 */
export function signup({ email, username, password }) {
  return apiClient.post("/api/auth/signup", { email, username, password });
}

/**
 * POST /api/auth/login
 * Returns { status, user, accessToken } on success.
 * Sets refresh-token cookie via backend response.
 */
export function login({ email, password }) {
  return apiClient.post("/api/auth/login", { email, password });
}

/**
 * POST /api/auth/resend-verification
 * Response is intentionally identical for all cases (security).
 */
export function resendVerification({ email }) {
  return apiClient.post("/api/auth/resend-verification", { email });
}

/**
 * POST /api/auth/verify-email
 * Verifies account via 64-char hex token.
 */
export function verifyEmail({ token }) {
  return apiClient.post("/api/auth/verify-email", { token });
}

/**
 * POST /api/auth/refresh
 * Uses refreshClient (no auth interceptor) to avoid circular dependency.
 * The browser sends the refresh cookie automatically.
 */
export function refresh() {
  return refreshClient.post("/api/auth/refresh");
}

/**
 * POST /api/auth/logout
 * Best-effort network call. Local cleanup happens regardless in the hook.
 */
export function logout() {
  return apiClient.post("/api/auth/logout");
}
