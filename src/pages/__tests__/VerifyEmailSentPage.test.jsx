import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.js";
import { renderWithProviders } from "../../test/test-utils.jsx";
import VerifyEmailSentPage from "../VerifyEmailSentPage.jsx";
import { Route, Routes } from "react-router-dom";
import toast from "react-hot-toast";

describe("VerifyEmailSentPage", () => {
  const TestSetup = () => (
    <Routes>
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
    </Routes>
  );

  it("renders with email from state", () => {
    renderWithProviders(<TestSetup />, {
      initialEntries: [{ pathname: "/verify-email-sent", state: { email: "test@example.com" } }]
    });
    
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address to resend to/i)).not.toBeInTheDocument();
  });

  it("renders resend form if email is missing", () => {
    renderWithProviders(<TestSetup />, { initialEntries: ["/verify-email-sent"] });
    expect(screen.getByLabelText(/email address to resend to/i)).toBeInTheDocument();
  });

  it("shows success toast on resend without revealing account existence", async () => {
    server.use(
      http.post("*/api/auth/resend-verification", () => {
        return HttpResponse.json({ message: "Sent" });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<TestSetup />, { initialEntries: ["/verify-email-sent"] });
    
    await user.type(screen.getByLabelText(/email address to resend to/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /resend verification email/i }));
    
    // Using toast mock might be tricky, but we can just await the mutation success visually
    // or rely on the toast implementation. Since toast renders in the provider, we can find it.
    expect(await screen.findByText(/If the account exists and is not verified, a verification email has been sent/i)).toBeInTheDocument();
  });
});
