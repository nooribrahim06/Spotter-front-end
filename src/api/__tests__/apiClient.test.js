import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.js";
import { apiClient, refreshAuth } from "../apiClient.js";
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
});
