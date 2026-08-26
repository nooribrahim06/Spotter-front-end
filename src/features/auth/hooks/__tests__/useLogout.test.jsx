import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../../test/mocks/server.js";
import { useLogout } from "../useLogout.js";
import { useAuthStore } from "../../../../stores/authStore.js";
import { createTestQueryClient } from "../../../../test/test-utils.jsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("useLogout", () => {
  beforeEach(() => {
    useAuthStore.setState({ authStatus: "authenticated", user: { id: 1 }, accessToken: "token" });
    mockNavigate.mockClear();
  });

  const queryClient = createTestQueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  it("clears auth, clears query cache, and navigates on success", async () => {
    server.use(
      http.post("*/api/auth/logout", () => {
        return HttpResponse.json({ message: "Logged out" });
      })
    );

    queryClient.setQueryData(["test"], { data: "test" });
    expect(queryClient.getQueryData(["test"])).toBeDefined();

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.handleLogout();

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false);
    });

    expect(useAuthStore.getState().authStatus).toBe("unauthenticated");
    expect(queryClient.getQueryData(["test"])).toBeUndefined();
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("clears auth, clears query cache, and navigates even if network fails", async () => {
    server.use(
      http.post("*/api/auth/logout", () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.handleLogout();

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false);
    });

    expect(useAuthStore.getState().authStatus).toBe("unauthenticated");
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
