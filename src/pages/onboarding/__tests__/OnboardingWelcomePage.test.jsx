import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { resetOnboardingMock } from "../../../features/onboarding/api/onboarding.api.js";
import { useAuthStore } from "../../../stores/authStore.js";

vi.mock("gsap", () => ({
  default: { context: (callback) => { callback(); return { revert: vi.fn() }; }, to: vi.fn(), fromTo: vi.fn(), set: vi.fn() },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { create: vi.fn(), refresh: vi.fn() } }));
vi.mock("@gsap/react", () => ({ useGSAP: (callback) => callback() }));

import OnboardingWelcomePage from "../OnboardingWelcomePage.jsx";

describe("OnboardingWelcomePage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "token",
      user: { id: "user-1", username: "nour", onboardingStatus: "in_progress", onboardingStep: 3 },
    });
  });

  it("sends a server-confirmed completed user home and repairs auth state", async () => {
    resetOnboardingMock({
      status: "completed",
      currentStep: null,
      completedSteps: [1, 2, 3],
      data: {},
    });

    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<OnboardingWelcomePage />} />
        <Route path="/app/home" element={<div>App home</div>} />
      </Routes>,
      { initialEntries: ["/onboarding"] }
    );

    expect(await screen.findByText("App home")).toBeInTheDocument();
    expect(useAuthStore.getState().user.onboardingStatus).toBe("completed");
    expect(useAuthStore.getState().user.onboardingStep).toBeNull();
  });
});
