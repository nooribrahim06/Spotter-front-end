import { describe, it, expect } from "vitest";
import { apiClient, refreshClient } from "../apiClient.js";
import { login, refresh, logout, logoutAll } from "../auth.api.js";

describe("authentication cookie transport", () => {
  it.each([
    ["login", apiClient, () => login({ email: "fixture@example.test", password: "fixture-only" }), "/api/auth/login"],
    ["refresh", refreshClient, () => refresh(), "/api/auth/refresh"],
    ["logout", apiClient, () => logout(), "/api/auth/logout"],
    ["logout-all", apiClient, () => logoutAll(), "/api/auth/logout-all"],
  ])("includes browser credentials for %s", async (_name, client, invoke, url) => {
    const originalAdapter = client.defaults.adapter;
    let captured;
    client.defaults.adapter = async config => {
      captured = config;
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    try {
      await invoke();
      expect(captured.url).toBe(url);
      expect(captured.method).toBe("post");
      expect(captured.withCredentials).toBe(true);
      expect(captured.data || "").not.toContain("refreshToken");
    } finally {
      client.defaults.adapter = originalAdapter;
    }
  });
});
