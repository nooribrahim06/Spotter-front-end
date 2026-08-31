import { beforeEach, describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { useAuthStore } from "../../../stores/authStore.js";
import OnboardingPage from "../OnboardingPage.jsx";
import { resetOnboardingMock } from "../../../features/onboarding/api/onboarding.api.js";

const savedStepOne = {
  firstName: "Noor",
  lastName: "Ibrahim",
  birthYear: 2002,
  birthMonth: 8,
  birthDay: 27,
  adultConfirmed: true,
  sexForCalculation: "MALE",
  preferredUnitSystem: "METRIC",
  heightCm: 178,
  currentWeightKg: 82.5,
};

const TestRoutes = () => (
  <Routes>
    <Route path="/onboarding/:step" element={<OnboardingPage />} />
    <Route path="/onboarding/success" element={<div>Onboarding success</div>} />
    <Route path="/app/home" element={<div>App home</div>} />
  </Routes>
);

describe.sequential("OnboardingPage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "token",
      user: { id: "user-1", username: "noor", onboardingStatus: "not_started", onboardingStep: 1 },
    });
    resetOnboardingMock();
  });

  it("moves a new user back to step 1", async () => {
    renderWithProviders(<TestRoutes />, { initialEntries: ["/onboarding/3"] });
    expect(await screen.findByRole("heading", { name: /real starting point/i }, { timeout: 3000 })).toBeInTheDocument();
  });

  it("resumes returning users from the saved current step", async () => {
    resetOnboardingMock({
      status: "in_progress",
      currentStep: 2,
      completedSteps: [1],
      data: savedStepOne,
    });
    renderWithProviders(<TestRoutes />, { initialEntries: ["/onboarding/3"] });
    expect(await screen.findByRole("heading", { name: /where movement should take you/i })).toBeInTheDocument();
  });

  it("redirects completed onboarding state to home", async () => {
    resetOnboardingMock({
      status: "completed",
      currentStep: null,
      completedSteps: [1, 2, 3],
      data: savedStepOne,
    });
    renderWithProviders(<TestRoutes />, { initialEntries: ["/onboarding/1"] });
    expect(await screen.findByText("App home")).toBeInTheDocument();
    expect(useAuthStore.getState().user.onboardingStatus).toBe("completed");
    expect(useAuthStore.getState().user.onboardingStep).toBeNull();
  });

  it("blocks step 1 when measurements are outside the contract", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestRoutes />, { initialEntries: ["/onboarding/1"] });
    await screen.findByRole("heading", { name: /real starting point/i });

    await user.type(screen.getByLabelText("First name"), "Noor");
    await user.type(screen.getByLabelText("Last name"), "Ibrahim");
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "2002-08-27" } });
    await user.click(screen.getByText("Male"));
    await user.type(screen.getByLabelText("Height"), "99");
    await user.type(screen.getByLabelText("Current weight"), "82");
    await user.click(screen.getByText(/I confirm I'm 18 or older/i));
    await user.click(screen.getByRole("button", { name: /save and continue/i }));

    expect(await screen.findByText(/height must be at least 100 cm/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveFocus();
  });

  it("shows target weight only for goals that use it", async () => {
    resetOnboardingMock({
      status: "in_progress",
      currentStep: 2,
      completedSteps: [1],
      data: savedStepOne,
    });
    const user = userEvent.setup();
    renderWithProviders(<TestRoutes />, { initialEntries: ["/onboarding/2"] });
    await screen.findByRole("heading", { name: /where movement should take you/i });

    await user.click(screen.getByText("Maintain"));
    expect(screen.queryByLabelText(/target weight/i)).not.toBeInTheDocument();

    await user.click(screen.getByText("Lose weight"));
    expect(screen.getByLabelText("Target weight")).toBeInTheDocument();
  });

  it("completes once, updates auth state, and navigates to success", async () => {
    resetOnboardingMock({
      status: "in_progress",
      currentStep: 3,
      completedSteps: [1, 2],
      data: {
        ...savedStepOne,
        goalType: "LOSE_WEIGHT",
        targetWeightKg: 75,
        targetDate: null,
        activityLevel: "MODERATELY_ACTIVE",
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<TestRoutes />, { initialEntries: ["/onboarding/3"] });
    await screen.findByRole("heading", { name: /starting story/i });

    await user.click(screen.getByRole("button", { name: /complete my setup/i }));

    expect(await screen.findByText("Onboarding success")).toBeInTheDocument();
    expect(useAuthStore.getState().user.onboardingStatus).toBe("completed");
    expect(useAuthStore.getState().user.firstName).toBe("Noor");
  });
});
