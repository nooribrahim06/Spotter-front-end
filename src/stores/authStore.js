import { create } from "zustand";

/**
 * Zustand auth store — the single source of truth for:
 *   - authStatus: "initializing" | "authenticated" | "unauthenticated"
 *   - user: null | { id, email, username }
 *   - accessToken: null | string (memory-only, never persisted)
 *
 * The access token must NEVER be written to localStorage, sessionStorage,
 * IndexedDB, logs, analytics, or rendered markup.
 */
export const useAuthStore = create((set) => ({
  authStatus: "initializing",
  user: null,
  accessToken: null,

  /**
   * Set the authenticated user and access token.
   * Automatically sets authStatus to "authenticated".
   */
  setAuth: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      authStatus: "authenticated",
    }),

  /**
   * Update only the access token (e.g., after a silent refresh).
   */
  setAccessToken: (accessToken) => set({ accessToken }),

  /**
   * Explicitly set the auth status.
   */
  setAuthStatus: (authStatus) => set({ authStatus }),

  /**
   * Clear all auth state. Used on logout and terminal session errors.
   */
  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      authStatus: "unauthenticated",
    }),
}));
