import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { useAuthStore } from "../../../stores/authStore.js";
import AuthGuard from "../AuthGuard.jsx";
import { Route, Routes } from "react-router-dom";

describe("AuthGuard", () => {
  beforeEach(() => {
    useAuthStore.setState({ authStatus: "initializing" });
  });

  const TestSetup = () => (
    <Routes>
      <Route element={<AuthGuard />}>
        <Route path="/protected" element={<div>Protected Content</div>} />
      </Route>
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>
  );

  it("renders loading spinner while initializing", () => {
    useAuthStore.setState({ authStatus: "initializing" });
    renderWithProviders(<TestSetup />, { initialEntries: ["/protected"] });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to login when unauthenticated", () => {
    useAuthStore.setState({ authStatus: "unauthenticated" });
    renderWithProviders(<TestSetup />, { initialEntries: ["/protected"] });
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    useAuthStore.setState({ authStatus: "authenticated" });
    renderWithProviders(<TestSetup />, { initialEntries: ["/protected"] });
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
