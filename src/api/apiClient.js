import axios from "axios";
import { useAuthStore } from "../stores/authStore.js";

/* ─────────────────────────────────────────────────────────────
 * Two Axios instances prevent the circular dependency:
 *   apiClient → authApi → apiClient
 *
 *   apiClient      — Access-token request interceptor
 *                    + response interceptor (refresh on 401)
 *   refreshClient  — Cookie-based refresh only; no auth
 *                    response interceptor
 * ───────────────────────────────────────────────────────────── */

const baseConfig = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

/**
 * refreshClient — bare Axios instance for POST /api/auth/refresh.
 * No auth interceptor to avoid circular refresh triggers.
 */
export const refreshClient = axios.create(baseConfig);

/**
 * apiClient — main Axios instance for all API calls.
 * Request interceptor attaches the Bearer token.
 * Response interceptor handles INVALID_ACCESS_TOKEN by refreshing.
 */
export const apiClient = axios.create(baseConfig);

/* ─────────────────────────────────────────────────────────────
 * Auth endpoints that must NEVER trigger the refresh interceptor.
 * Prevents recursive refresh loops.
 * ───────────────────────────────────────────────────────────── */
const AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/refresh",
  "/api/auth/logout",
];

function isAuthEndpoint(url) {
  return AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
}

/* ─────────────────────────────────────────────────────────────
 * REQUEST INTERCEPTOR — attach Bearer token
 * ───────────────────────────────────────────────────────────── */
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ─────────────────────────────────────────────────────────────
 * SINGLE-FLIGHT REFRESH COORDINATOR
 *
 * One module-level promise ensures:
 *   - All concurrent callers await the same refresh attempt
 *   - Works correctly under React Strict Mode (double mount)
 *   - Handles REFRESH_TOKEN_ALREADY_ROTATED with one retry
 *   - Terminal errors clear auth immediately
 *
 * Used by both startup (useAuthInit) and the response interceptor.
 * ───────────────────────────────────────────────────────────── */
let refreshPromise = null;

/**
 * Attempt a single refresh call. Handles race recovery.
 * @returns {Promise<{user, accessToken}>}
 */
async function doRefresh() {
  try {
    const { data } = await refreshClient.post("/api/auth/refresh");
    return data;
  } catch (error) {
    const code = error.response?.data?.code;

    // Race recovery: another tab rotated the token
    if (code === "REFRESH_TOKEN_ALREADY_ROTATED") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      // One recovery attempt through the same coordinator
      const { data } = await refreshClient.post("/api/auth/refresh");
      return data;
    }

    throw error;
  }
}

/**
 * Single-flight refresh coordinator.
 * All callers share the same in-flight promise.
 *
 * @returns {Promise<{user, accessToken}>} The refreshed auth data
 * @throws The original error if refresh fails terminally
 */
export async function refreshAuth() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/* ─────────────────────────────────────────────────────────────
 * RESPONSE INTERCEPTOR — refresh on INVALID_ACCESS_TOKEN
 *
 * Rules:
 *   - Only triggers on INVALID_ACCESS_TOKEN error code
 *   - Never triggers for auth endpoints (prevents loops)
 *   - Each original request retries at most once
 *   - Terminal errors (INVALID_CREDENTIALS, THEFT_DETECTED)
 *     clear auth state
 * ───────────────────────────────────────────────────────────── */
apiClient.interceptors.response.use(
  // Success: pass through
  (response) => response,

  // Error: attempt refresh if appropriate
  async (error) => {
    const originalRequest = error.config;
    const errorCode = error.response?.data?.code;

    // Only attempt refresh for INVALID_ACCESS_TOKEN
    const shouldRefresh =
      errorCode === "INVALID_ACCESS_TOKEN" &&
      !originalRequest._retried &&
      !isAuthEndpoint(originalRequest.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    // Mark as retried so we don't loop
    originalRequest._retried = true;

    try {
      const data = await refreshAuth();

      // Update the store with new auth data
      useAuthStore.getState().setAuth({
        user: data.user,
        accessToken: data.accessToken,
      });

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      const refreshCode = refreshError.response?.data?.code;

      // Terminal session errors: clear auth
      if (
        refreshCode === "INVALID_CREDENTIALS" ||
        refreshCode === "REFRESH_TOKEN_THEFT_DETECTED"
      ) {
        useAuthStore.getState().clearAuth();
      }

      return Promise.reject(refreshError);
    }
  }
);
