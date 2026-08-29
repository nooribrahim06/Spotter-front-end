import { apiClient } from "../../../api/apiClient.js";

export const ONBOARDING_CONFIG = Object.freeze({
  goalTypes: [
    "LOSE_WEIGHT",
    "MAINTAIN_WEIGHT",
    "GAIN_WEIGHT",
    "BUILD_MUSCLE",
    "IMPROVE_FITNESS",
  ],
  activityLevels: [
    "SEDENTARY",
    "LIGHTLY_ACTIVE",
    "MODERATELY_ACTIVE",
    "VERY_ACTIVE",
  ],
  sexForCalculationOptions: ["MALE", "FEMALE"],
  unitSystems: ["METRIC", "IMPERIAL"],
  constraints: {
    minimumAge: 18,
    maximumAge: 100,
    minimumHeightCm: 100,
    maximumHeightCm: 250,
    minimumWeightKg: 30,
    maximumWeightKg: 350,
  },
});

const useMocks = import.meta.env.VITE_USE_ONBOARDING_MOCKS !== "false";
const mockDelay = import.meta.env.MODE === "test" ? 0 : 360;

const createInitialState = () => ({
  status: "not_started",
  currentStep: 1,
  completedSteps: [],
  data: {},
});

let mockState = createInitialState();

const wait = () => new Promise((resolve) => window.setTimeout(resolve, mockDelay));
const clone = (value) => JSON.parse(JSON.stringify(value));

export async function getOnboardingConfig() {
  if (!useMocks) {
    const response = await apiClient.get("/api/onboarding/config");
    return response.data;
  }

  await wait();
  return clone(ONBOARDING_CONFIG);
}

export async function loadOnboarding() {
  if (!useMocks) {
    const response = await apiClient.get("/api/onboarding", {
      headers: { "Cache-Control": "no-store" },
    });
    return response.data;
  }

  await wait();
  return clone(mockState);
}

export async function saveOnboardingStep({ step, data }) {
  if (!useMocks) {
    const response = await apiClient.patch("/api/onboarding", { step, data });
    return response.data;
  }

  await wait();
  mockState = {
    status: "in_progress",
    currentStep: Math.min(step + 1, 3),
    completedSteps: [...new Set([...mockState.completedSteps, step])].sort(),
    data: { ...mockState.data, ...clone(data) },
  };

  return {
    message: "Onboarding progress saved.",
    status: mockState.status,
    currentStep: mockState.currentStep,
    completedSteps: [...mockState.completedSteps],
    data: clone(mockState.data),
  };
}

export async function completeOnboarding() {
  if (!useMocks) {
    const response = await apiClient.post("/api/onboarding/complete");
    return response.data;
  }

  await wait();
  mockState = {
    ...mockState,
    status: "completed",
    currentStep: null,
    completedSteps: [1, 2, 3],
  };

  return {
    message: "Fitness onboarding completed.",
    user: {
      onboardingStatus: "completed",
      onboardingStep: null,
    },
  };
}

export function resetOnboardingMock(nextState = createInitialState()) {
  mockState = clone(nextState);
}
