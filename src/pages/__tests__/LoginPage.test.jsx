import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.js";
import { renderWithProviders } from "../../test/test-utils.jsx";
import LoginPage from "../LoginPage.jsx";
import { Route, Routes } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";

describe("LoginPage", () => {
  const TestSetup = () => (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app/home" element={<div>Home Page</div>} />
    </Routes>
  );

  it("renders the login form", () => {
    renderWithProviders(<TestSetup />, { initialEntries: ["/login"] });
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("navigates to return path on success", async () => {
    server.use(
      http.post("*/api/auth/login", () => {
        return HttpResponse.json({
          status: "success",
          user: { id: 1 },
          accessToken: "token"
        });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<TestSetup />, {
      initialEntries: [{ pathname: "/login", state: { from: "/app/home" } }]
    });
    
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /log in/i }));
    
    expect(await screen.findByText("Home Page")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBe("token");
  });

  it("shows generic error for INVALID_CREDENTIALS", async () => {
    server.use(
      http.post("*/api/auth/login", () => {
        return HttpResponse.json({
          code: "INVALID_CREDENTIALS",
          error: "Some backend specific message"
        }, { status: 401 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<TestSetup />, { initialEntries: ["/login"] });
    
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /log in/i }));
    
    expect(await screen.findByText("Email or password is not valid.")).toBeInTheDocument();
    expect(screen.queryByText("Some backend specific message")).not.toBeInTheDocument();
  });
});
