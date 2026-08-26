import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.js";
import { useAuthInit } from "../useAuthInit.js";
import { useAuthStore } from "../../stores/authStore.js";
import { createTestQueryClient } from "../../test/test-utils.jsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";

describe("useAuthInit", () => {
  beforeEach(() => {
    useAuthStore.setState({ authStatus: "initializing", user: null, accessToken: null });
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it("sets authenticated state on successful refresh", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json({ user: { id: 1 }, accessToken: "token" });
      })
    );

    renderHook(() => useAuthInit(), { wrapper });

    await waitFor(() => {
      expect(useAuthStore.getState().authStatus).toBe("authenticated");
    });
    expect(useAuthStore.getState().user).toEqual({ id: 1 });
  });

  it("resolves authentication during React Strict Mode remounts", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
      })
    );

    const strictWrapper = ({ children }) => (
      <StrictMode>
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      </StrictMode>
    );

    renderHook(() => useAuthInit(), { wrapper: strictWrapper });

    await waitFor(() => {
      expect(useAuthStore.getState().authStatus).toBe("unauthenticated");
    });
  });

  it("sets unauthenticated state on terminal 401 error", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
      })
    );

    renderHook(() => useAuthInit(), { wrapper });

    await waitFor(() => {
      expect(useAuthStore.getState().authStatus).toBe("unauthenticated");
    });
  });

  it("sets initError on network failure and remains initializing", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useAuthInit(), { wrapper });

    await waitFor(() => {
      expect(result.current.initError).not.toBeNull();
    });
    expect(useAuthStore.getState().authStatus).toBe("initializing");
  });
});
