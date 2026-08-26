import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { useAuthStore } from "../../../stores/authStore.js";
import GuestGuard from "../GuestGuard.jsx";
import { Route, Routes } from "react-router-dom";

describe("GuestGuard", () => {
  beforeEach(() => {
    useAuthStore.setState({ authStatus: "initializing" });
  });

  const TestSetup = () => (
    <Routes>
      <Route element={<GuestGuard />}>
        <Route path="/guest" element={<div>Guest Content</div>} />
      </Route>
      <Route path="/app/home" element={<div>Home Page</div>} />
    </Routes>
  );

  it("renders loading spinner while initializing", () => {
    useAuthStore.setState({ authStatus: "initializing" });
    renderWithProviders(<TestSetup />, { initialEntries: ["/guest"] });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to home when authenticated", () => {
    useAuthStore.setState({ authStatus: "authenticated" });
    renderWithProviders(<TestSetup />, { initialEntries: ["/guest"] });
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("renders children when unauthenticated", () => {
    useAuthStore.setState({ authStatus: "unauthenticated" });
    renderWithProviders(<TestSetup />, { initialEntries: ["/guest"] });
    expect(screen.getByText("Guest Content")).toBeInTheDocument();
  });
});
