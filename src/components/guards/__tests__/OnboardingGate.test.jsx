import { beforeEach, describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { useAuthStore } from "../../../stores/authStore.js";
import OnboardingGate from "../OnboardingGate.jsx";

describe("OnboardingGate", () => {
  beforeEach(() => {
    useAuthStore.setState({ authStatus: "authenticated", accessToken: "token", user: null });
  });

  const RoutesUnderTest = () => (
    <Routes>
      <Route element={<OnboardingGate />}>
        <Route path="/app/home" element={<div>Protected home</div>} />
      </Route>
      <Route path="/onboarding" element={<div>Start onboarding</div>} />
      <Route path="/onboarding/:step" element={<div>Resume onboarding</div>} />
    </Routes>
  );

  it("sends new users to the onboarding invitation", async () => {
    useAuthStore.setState({ user: { onboardingStatus: "not_started" } });
    renderWithProviders(<RoutesUnderTest />, { initialEntries: ["/app/home"] });
    expect(await screen.findByText("Start onboarding")).toBeInTheDocument();
  });

  it("resumes an in-progress user at the server-provided step", async () => {
    useAuthStore.setState({ user: { onboardingStatus: "in_progress", onboardingStep: 2 } });
    renderWithProviders(<RoutesUnderTest />, { initialEntries: ["/app/home"] });
    expect(await screen.findByText("Resume onboarding")).toBeInTheDocument();
  });

  it("allows completed users into the app", () => {
    useAuthStore.setState({ user: { onboardingStatus: "completed" } });
    renderWithProviders(<RoutesUnderTest />, { initialEntries: ["/app/home"] });
    expect(screen.getByText("Protected home")).toBeInTheDocument();
  });
});
