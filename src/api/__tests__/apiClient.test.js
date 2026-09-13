import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.js";
import { apiClient, refreshAuth } from "../apiClient.js";
import { refresh } from "../auth.api.js";
import { useAuthStore } from "../../stores/authStore.js";

describe("apiClient", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: "test-token" });
    vi.useFakeTimers();
  });

  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, authStatus: "unauthenticated" });
    vi.useRealTimers();
  });

  it("attaches Authorization header if token exists", async () => {
    let capturedHeaders;
    server.use(
      http.get("*/api/test", ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ ok: true });
      })
    );

    await apiClient.get("/api/test");
    expect(capturedHeaders.get("Authorization")).toBe("Bearer test-token");
  });

  it("triggers refresh on INVALID_ACCESS_TOKEN and retries", async () => {
    let attempts = 0;
    server.use(
      // The failing request
      http.get("*/api/test", () => {
        attempts++;
        if (attempts === 1) {
          return HttpResponse.json({ code: "INVALID_ACCESS_TOKEN" }, { status: 401 });
        }
        return HttpResponse.json({ success: true });
      }),
      // The refresh endpoint
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json({ user: { id: 1 }, accessToken: "new-token" });
      })
    );

    const response = await apiClient.get("/api/test");
    
    expect(response.data).toEqual({ success: true });
    expect(attempts).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe("new-token");
  });

  it("does not trigger refresh for auth endpoints", async () => {
    server.use(
      http.post("*/api/auth/login", () => {
        return HttpResponse.json({ code: "INVALID_ACCESS_TOKEN" }, { status: 401 });
      }),
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json({ ok: true }); // Should not be called
      })
    );

    const apiClientModule = await import("../apiClient.js");
    const refreshSpy = vi.spyOn(apiClientModule, "refreshAuth");

    await expect(apiClientModule.apiClient.post("/api/auth/login")).rejects.toThrow();
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it.each(["INVALID_CREDENTIALS", "INVALID_REFRESH_TOKEN", "INVALID_SESSION", "REFRESH_TOKEN_THEFT_DETECTED"])(
    "clears auth on terminal refresh error %s",
    async (code) => {
      server.use(
        http.get("*/api/test", () => {
          return HttpResponse.json({ code: "INVALID_ACCESS_TOKEN" }, { status: 401 });
        }),
        http.post("*/api/auth/refresh", () => {
          return HttpResponse.json({ code }, { status: 401 });
        })
      );

      await expect(apiClient.get("/api/test")).rejects.toThrow();
      expect(useAuthStore.getState().authStatus).toBe("unauthenticated");
    }
  );
  it("shares one refresh request across concurrent training 401 responses", async () => {
    vi.useRealTimers();
    let refreshCount = 0;
    let unauthorizedCount = 0;
    let releaseUnauthorized;
    const bothRequestsArrived = new Promise(resolve => { releaseUnauthorized = resolve; });
    const respond = async ({ request }) => {
      if (request.headers.get('Authorization') === 'Bearer refreshed-training-token') return HttpResponse.json({ data: {} });
      unauthorizedCount++;
      if (unauthorizedCount === 2) releaseUnauthorized();
      await bothRequestsArrived;
      return HttpResponse.json({ code: 'INVALID_ACCESS_TOKEN' }, { status: 401 });
    };
    server.use(
      http.get('*/api/workouts/active', respond),
      http.get('*/api/exercises/config', respond),
      http.post('*/api/auth/refresh', async () => {
        refreshCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return HttpResponse.json({ user: { id: 'training-user' }, accessToken: 'refreshed-training-token' });
      }),
    );
    const responses = await Promise.all([apiClient.get('/api/workouts/active'), apiClient.get('/api/exercises/config')]);
    expect(responses.map(response => response.status)).toEqual([200, 200]);
    expect(unauthorizedCount).toBe(2);
    expect(refreshCount).toBe(1);
    expect(useAuthStore.getState().accessToken).toBe('refreshed-training-token');
  });

  it("retries immediately with the new token without refreshing if another request already refreshed auth", async () => {
    vi.useRealTimers();
    let refreshCount = 0;
    let requestAttempts = 0;

    server.use(
      http.get("*/api/test-stale-race", ({ request }) => {
        requestAttempts++;
        if (requestAttempts === 1) {
          // While this request was in flight, another request refreshed the token in the background:
          useAuthStore.setState({ accessToken: "already-refreshed-token" });
          return HttpResponse.json({ code: "INVALID_ACCESS_TOKEN" }, { status: 401 });
        }
        if (request.headers.get("Authorization") === "Bearer already-refreshed-token") {
          return HttpResponse.json({ success: true });
        }
        return HttpResponse.json({ code: "INVALID_ACCESS_TOKEN" }, { status: 401 });
      }),
      http.post("*/api/auth/refresh", () => {
        refreshCount++;
        return HttpResponse.json({ user: { id: 1 }, accessToken: "should-not-be-called" });
      })
    );

    useAuthStore.setState({ accessToken: "stale-token" });

    const response = await apiClient.get("/api/test-stale-race");

    expect(response.data).toEqual({ success: true });
    expect(requestAttempts).toBe(2);
    // Crucial: refresh must NOT have been called again!
    expect(refreshCount).toBe(0);
  });

  it("shares refresh between startup, the public helper and an expired API request", async () => {
    vi.useRealTimers();
    let refreshCount = 0;
    server.use(
      http.get("*/api/test-coordinator", ({ request }) => request.headers.get("Authorization") === "Bearer coordinated-token"
        ? HttpResponse.json({ ok: true })
        : HttpResponse.json({ code: "INVALID_ACCESS_TOKEN" }, { status: 401 })),
      http.post("*/api/auth/refresh", async () => {
        refreshCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({ user: { id: "same-user" }, accessToken: "coordinated-token" });
      })
    );
    const [startup, helper, protectedResponse] = await Promise.all([
      refreshAuth(), refresh(), apiClient.get("/api/test-coordinator"),
    ]);
    expect(refreshCount).toBe(1);
    expect(startup.accessToken).toBe("coordinated-token");
    expect(helper.status).toBe(200);
    expect(helper.data).toEqual(startup);
    expect(protectedResponse.data).toEqual({ ok: true });
  });

  it("retries a rotation conflict only once without logging the user out", async () => {
    vi.useRealTimers();
    let refreshCount = 0;
    useAuthStore.setState({ authStatus: "authenticated", user: { id: "same-user" } });
    server.use(
      http.get("*/api/test-race-limit", () => HttpResponse.json({ code: "INVALID_ACCESS_TOKEN" }, { status: 401 })),
      http.post("*/api/auth/refresh", () => {
        refreshCount++;
        return HttpResponse.json({ code: "REFRESH_TOKEN_ALREADY_ROTATED" }, { status: 409 });
      })
    );
    await expect(apiClient.get("/api/test-race-limit")).rejects.toMatchObject({ response: { status: 409 } });
    expect(refreshCount).toBe(2);
    expect(useAuthStore.getState().authStatus).toBe("authenticated");
  });

  it("releases a failed refresh so a later explicit retry can succeed", async () => {
    vi.useRealTimers();
    let refreshCount = 0;
    server.use(http.post("*/api/auth/refresh", () => {
      refreshCount++;
      return refreshCount === 1
        ? HttpResponse.json({ code: "INTERNAL_SERVER_ERROR" }, { status: 500 })
        : HttpResponse.json({ user: { id: "same-user" }, accessToken: "retry-token" });
    }));
    await expect(refreshAuth()).rejects.toMatchObject({ response: { status: 500 } });
    await expect(refreshAuth()).resolves.toMatchObject({ accessToken: "retry-token" });
    expect(refreshCount).toBe(2);
  });
});
