import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.js";
import { renderWithProviders } from "../../test/test-utils.jsx";
import SignupPage from "../SignupPage.jsx";
import { Route, Routes } from "react-router-dom";

describe("SignupPage", () => {
  const TestSetup = () => (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email-sent" element={<div>Verify Email Sent</div>} />
    </Routes>
  );

  it("renders the signup form", () => {
    renderWithProviders(<TestSetup />, { initialEntries: ["/signup"] });
    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows client-side validation errors", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestSetup />, { initialEntries: ["/signup"] });
    
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("navigates to verification page on success", async () => {
    server.use(
      http.post("*/api/auth/signup", () => {
        return HttpResponse.json({ message: "Created" }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<TestSetup />, { initialEntries: ["/signup"] });
    
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    
    expect(await screen.findByText("Verify Email Sent")).toBeInTheDocument();
  });

  it("displays server validation errors", async () => {
    server.use(
      http.post("*/api/auth/signup", () => {
        return HttpResponse.json({
          code: "INVALID_SCHEMA",
          details: [{ field: "email", message: "Server email error" }]
        }, { status: 400 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<TestSetup />, { initialEntries: ["/signup"] });
    
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    
    expect(await screen.findByText("Server email error")).toBeInTheDocument();
  });
});
