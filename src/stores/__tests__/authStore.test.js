import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../authStore.js";

describe("authStore", () => {
  beforeEach(() => {
    // Reset Zustand store state between tests
    useAuthStore.setState({
      authStatus: "initializing",
      user: null,
      accessToken: null,
    });
  });

  it("has correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.authStatus).toBe("initializing");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it("setAuth updates user, token, and status", () => {
    useAuthStore.getState().setAuth({
      user: { id: 1, email: "test@example.com" },
      accessToken: "token123",
    });

    const state = useAuthStore.getState();
    expect(state.authStatus).toBe("authenticated");
    expect(state.user).toEqual({ id: 1, email: "test@example.com" });
    expect(state.accessToken).toBe("token123");
  });

  it("setAccessToken updates only token", () => {
    useAuthStore.getState().setAccessToken("new-token");

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-token");
    expect(state.authStatus).toBe("initializing"); // Unchanged
  });

  it("setAuthStatus updates only status", () => {
    useAuthStore.getState().setAuthStatus("unauthenticated");

    const state = useAuthStore.getState();
    expect(state.authStatus).toBe("unauthenticated");
  });

  it("clearAuth resets to unauthenticated", () => {
    useAuthStore.getState().setAuth({
      user: { id: 1 },
      accessToken: "token",
    });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.authStatus).toBe("unauthenticated");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
