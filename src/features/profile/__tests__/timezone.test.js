import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "../../../test/mocks/server.js";
import { useAuthStore } from "../../../stores/authStore.js";
import { queryClient } from "../../../queryClient.js";
import {
  detectBrowserTimezone,
  getTimezoneList,
  syncUserTimezone,
  useTimezoneSync,
} from "../timezone.js";

describe("timezone utilities", () => {
  beforeEach(() => {
    useAuthStore.setState({
      authStatus: "unauthenticated",
      accessToken: null,
      user: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects the browser timezone or falls back to UTC", () => {
    const tz = detectBrowserTimezone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  it("returns a sorted list of IANA timezones and ensures the provided timezone is included", () => {
    const list = getTimezoneList("Mars/Olympus_Mons");
    expect(list).toContain("Mars/Olympus_Mons");
    expect(list).toContain("Africa/Cairo");
    expect(list).toContain("UTC");
  });

  it("does nothing and returns null if the user is unauthenticated", async () => {
    const result = await syncUserTimezone();
    expect(result).toBeNull();
  });

  it("returns the existing timezone without network calls if user store already has it", async () => {
    let profileCalled = false;
    server.use(
      http.get("*/api/profiles/me", () => {
        profileCalled = true;
        return HttpResponse.json({ data: {} });
      })
    );

    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "valid-token",
      user: { id: "1", timezone: "Africa/Cairo" },
    });

    const result = await syncUserTimezone();
    expect(result).toBe("Africa/Cairo");
    expect(profileCalled).toBe(false);
  });

  it("updates user store from server profile if profile already has timezone", async () => {
    let patchCalled = false;
    server.use(
      http.get("*/api/profiles/me", () => {
        return HttpResponse.json({
          data: {
            account: { timezone: "Europe/London" },
          },
        });
      }),
      http.patch("*/api/profiles/me/account-preferences", () => {
        patchCalled = true;
        return HttpResponse.json({ data: {} });
      })
    );

    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "valid-token",
      user: { id: "1", timezone: null },
    });

    const result = await syncUserTimezone();
    expect(result).toBe("Europe/London");
    expect(patchCalled).toBe(false);
    expect(useAuthStore.getState().user.timezone).toBe("Europe/London");
  });

  it("detects browser timezone and sends PATCH when timezone is missing", async () => {
    let patchBody = null;
    server.use(
      http.get("*/api/profiles/me", () => {
        return HttpResponse.json({
          data: {
            account: { timezone: null },
          },
        });
      }),
      http.patch("*/api/profiles/me/account-preferences", async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json({ data: { timezone: patchBody.timezone } });
      })
    );

    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "valid-token",
      user: { id: "1", timezone: null },
    });

    const detected = detectBrowserTimezone();
    const result = await syncUserTimezone(queryClient);

    expect(result).toBe(detected);
    expect(patchBody).toEqual({ timezone: detected });
    expect(useAuthStore.getState().user.timezone).toBe(detected);
  });

  it("deduplicates concurrent sync requests into a single network call", async () => {
    let patchCount = 0;
    server.use(
      http.get("*/api/profiles/me", () => {
        return HttpResponse.json({
          data: {
            account: { timezone: null },
          },
        });
      }),
      http.patch("*/api/profiles/me/account-preferences", async () => {
        patchCount++;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ data: {} });
      })
    );

    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "valid-token",
      user: { id: "1", timezone: null },
    });

    const [r1, r2, r3] = await Promise.all([
      syncUserTimezone(queryClient),
      syncUserTimezone(queryClient),
      syncUserTimezone(queryClient),
    ]);

    expect(patchCount).toBe(1);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it("useTimezoneSync triggers sync when authenticated without timezone", async () => {
    let patchCalled = false;
    server.use(
      http.get("*/api/profiles/me", () => {
        return HttpResponse.json({ data: { account: { timezone: null } } });
      }),
      http.patch("*/api/profiles/me/account-preferences", () => {
        patchCalled = true;
        return HttpResponse.json({ data: {} });
      })
    );

    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "valid-token",
      user: { id: "1", timezone: null },
    });

    renderHook(() => useTimezoneSync());

    await waitFor(() => {
      expect(patchCalled).toBe(true);
    });
  });
});
