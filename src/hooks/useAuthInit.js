import { useState, useEffect } from "react";
import { refreshAuth } from "../api/apiClient.js";
import { useAuthStore } from "../stores/authStore.js";
import { syncUserTimezone } from "../features/profile/timezone.js";

/**
 * useAuthInit — Application startup authentication hook.
 *
 * Runs on App mount:
 *   → authStatus = "initializing"
 *   → calls the shared refresh coordinator
 *     → success: store user + access token; "authenticated"
 *     → 401 terminal session error: clear auth; "unauthenticated"
 *     → refresh-race response: recovery attempt (handled by coordinator)
 *     → network/5xx: show initialization error with Retry
 *
 * A network outage must NOT be presented as "wrong credentials" or
 * silently treated as a confirmed logout.
 *
 * No protected or guest-only route renders until initialization
 * reaches a resolved state.
 */
export function useAuthInit() {
  const [initError, setInitError] = useState(null);

  const setAuth = useAuthStore((s) => s.setAuth);
  const setAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        const data = await refreshAuth();

        if (!cancelled) {
          setAuth({ user: data.user, accessToken: data.accessToken });
          setInitError(null);
          syncUserTimezone();
        }
      } catch (error) {
        if (cancelled) return;

        const code = error.response?.data?.code;
        const status = error.response?.status;

        // Terminal session errors → confirmed unauthenticated
        if (
          code === "INVALID_CREDENTIALS" ||
          code === "REFRESH_TOKEN_THEFT_DETECTED" ||
          status === 401
        ) {
          clearAuth();
          setInitError(null);
          return;
        }

        // Network/5xx → initialization error, NOT a logout
        setAuthStatus("initializing");
        setInitError({
          code: code || "INIT_FAILED",
          message:
            "Unable to connect to the server. Please check your connection and try again.",
        });
      }
    }

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [setAuth, setAuthStatus, clearAuth]);

  /**
   * Retry initialization after a network/server error.
   */
  function retry() {
    setInitError(null);
    setAuthStatus("initializing");

    (async () => {
      try {
        const data = await refreshAuth();
        setAuth({ user: data.user, accessToken: data.accessToken });
        syncUserTimezone();
      } catch (error) {
        const code = error.response?.data?.code;
        const status = error.response?.status;

        if (
          code === "INVALID_CREDENTIALS" ||
          code === "REFRESH_TOKEN_THEFT_DETECTED" ||
          status === 401
        ) {
          clearAuth();
          return;
        }

        setAuthStatus("initializing");
        setInitError({
          code: code || "INIT_FAILED",
          message:
            "Unable to connect to the server. Please check your connection and try again.",
        });
      }
    })();
  }

  return { initError, retry };
}
