import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.js";
import { renderWithProviders } from "../../test/test-utils.jsx";
import VerifyEmailPage from "../VerifyEmailPage.jsx";
import { Route, Routes } from "react-router-dom";

describe("VerifyEmailPage", () => {
  const TestSetup = () => (
    <Routes>
      <Route path="/verify-email" element={<VerifyEmailPage />} />
    </Routes>
  );

  it("shows missing token state", () => {
    renderWithProviders(<TestSetup />, { initialEntries: ["/verify-email"] });
    expect(screen.getByText(/missing verification token/i)).toBeInTheDocument();
  });

  it("shows loading state initially with token", () => {
    // Keep request pending to see loading state
    server.use(
      http.post("*/api/auth/verify-email", () => {
        return new Promise(() => {}); // never resolves
      })
    );
    renderWithProviders(<TestSetup />, { initialEntries: ["/verify-email?token=123"] });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows success state on successful verification", async () => {
    server.use(
      http.post("*/api/auth/verify-email", () => {
        return HttpResponse.json({ message: "Verified" });
      })
    );
    renderWithProviders(<TestSetup />, { initialEntries: ["/verify-email?token=123"] });
    expect(await screen.findByText(/email verified successfully/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows invalid token state", async () => {
    server.use(
      http.post("*/api/auth/verify-email", () => {
        return HttpResponse.json({ code: "INVALID_TOKEN" }, { status: 400 });
      })
    );
    renderWithProviders(<TestSetup />, { initialEntries: ["/verify-email?token=123"] });
    expect(await screen.findByText(/link expired or invalid/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request new link/i })).toBeInTheDocument();
  });
});
