import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server.js";
import { useAuthStore } from "../stores/authStore.js";

/**
 * Spotter — Test Setup
 *
 * Runs before all tests:
 *   1. Start MSW server to intercept HTTP requests
 *   2. Register cleanup hooks for consistent test isolation
 */

// ── Mock matchMedia for react-hot-toast in JSDOM ───────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ── MSW Lifecycle ──────────────────────────────────────────
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  // Reset MSW handlers to defaults between tests
  server.resetHandlers();

  // Clean up rendered React trees
  cleanup();

  // Reset Zustand auth store to initial state
  useAuthStore.setState({
    authStatus: "initializing",
    user: null,
    accessToken: null,
  });
});

afterAll(() => {
  server.close();
});
