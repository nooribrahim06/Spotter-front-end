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
  "/api/auth/logout-all",
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
 * Attempt a refresh call. Handles recovery for clients without Web Locks.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
async function doRefresh() {
  try {
    const response = await refreshClient.post("/api/auth/refresh");
    return response;
  } catch (error) {
    const code = error.response?.data?.code;

    // Race recovery: another tab rotated the token
    if (code === "REFRESH_TOKEN_ALREADY_ROTATED") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      // One recovery attempt through the same coordinator
      const response = await refreshClient.post("/api/auth/refresh");
      return response;
    }

    throw error;
  }
}

/**
 * Single-flight refresh coordinator.
 * All callers share the same in-flight promise.
 *
 * @returns {Promise<import("axios").AxiosResponse>} The refresh response
 * @throws The original error if refresh fails terminally
 */
export async function refreshRequest() {
  if (refreshPromise) {
    return refreshPromise;
  }

  // The in-memory promise covers one tab. The browser lock also covers other
  // Spotter tabs sharing this origin and refresh cookie. Hold it until the
  // response arrives, so the next request sends the newly rotated cookie.
  const locks = globalThis.navigator?.locks;
  const apiOrigin = new URL(baseConfig.baseURL || "/", globalThis.location?.origin || "http://localhost").origin;
  const attempt = locks?.request
    ? locks.request(`spotter:auth-refresh:${apiOrigin}`, doRefresh)
    : doRefresh();

  refreshPromise = attempt.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/** Return auth data while preserving the Axios response for auth.api callers. */
export async function refreshAuth() {
  return (await refreshRequest()).data;
}
/* ─────────────────────────────────────────────────────────────
 * RESPONSE INTERCEPTOR — refresh on INVALID_ACCESS_TOKEN
 *
 * Rules:
 *   - Only triggers on INVALID_ACCESS_TOKEN error code
 *   - Never triggers for auth endpoints (prevents loops)
 *   - Each original request retries at most once
 *   - Terminal refresh/session errors clear auth state
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

    // Check if another request already refreshed the access token while this request was in flight
    const currentToken = useAuthStore.getState().accessToken;
    const rawHeader = originalRequest.headers?.Authorization ?? originalRequest.headers?.authorization;
    const requestHeader = typeof rawHeader === "string"
      ? rawHeader
      : typeof originalRequest.headers?.get === "function"
        ? originalRequest.headers.get("Authorization")
        : null;
    const requestToken = typeof requestHeader === "string" ? requestHeader.replace(/^Bearer\s+/i, "") : null;

    if (currentToken && requestToken && currentToken !== requestToken) {
      // Token was already refreshed by another concurrent request!
      // Retry immediately with the updated token without triggering another refresh call.
      if (typeof originalRequest.headers?.set === "function") {
        originalRequest.headers.set("Authorization", `Bearer ${currentToken}`);
      } else if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${currentToken}`;
      }
      return apiClient(originalRequest);
    }

    try {
      const data = await refreshAuth();

      // Update the store with new auth data
      useAuthStore.getState().setAuth({
        user: data.user,
        accessToken: data.accessToken,
      });

      // Retry the original request with the new token
      if (typeof originalRequest.headers?.set === "function") {
        originalRequest.headers.set("Authorization", `Bearer ${data.accessToken}`);
      } else if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      const refreshCode = refreshError.response?.data?.code;

      // Any rejected refresh means this browser no longer has a usable
      // authenticated session. Keep the route guards aligned with the server.
      if (refreshError.response?.status === 401 || refreshCode === "REFRESH_TOKEN_THEFT_DETECTED") {
        useAuthStore.getState().clearAuth();
      }

      return Promise.reject(refreshError);
    }
  }
);
