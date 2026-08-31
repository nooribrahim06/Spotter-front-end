import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { server } from "../../../test/mocks/server.js";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { useAuthStore } from "../../../stores/authStore.js";
import ProfilePage from "../ProfilePage.jsx";

const config = {
  sexForCalculation: ["MALE", "FEMALE"],
  unitSystems: ["METRIC", "IMPERIAL"],
  activityLevels: ["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE"],
  nutritionPlanStyles: ["EXACT_MEALS", "FLEXIBLE_MEALS", "MACRO_BASED", "SIMPLE_GUIDANCE"],
  cookingSkills: ["NONE", "BASIC", "INTERMEDIATE", "ADVANCED"],
  kitchenAccess: ["NONE", "MICROWAVE_ONLY", "BASIC", "FULL"],
  foodBudgetLevels: ["LOW", "MODERATE", "FLEXIBLE"],
  trainingExperienceLevels: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
  trainingEnvironments: ["COMMERCIAL_GYM", "HOME_GYM", "HOME_MINIMAL", "OUTDOORS", "MIXED"],
  coachingStyles: ["SUPPORTIVE", "BALANCED", "DIRECT"],
  explanationLevels: ["CONCISE", "NORMAL", "DETAILED"],
  motivationStyles: ["ENCOURAGING", "ACCOUNTABILITY", "FACT_BASED", "MINIMAL"],
  checkinFrequencies: ["DAILY", "FEW_TIMES_PER_WEEK", "WEEKLY"],
  bodyMeasurementTypes: ["WAIST", "CHEST"],
  constraints: {
    minimumAge: 18, maximumAge: 100,
    heightCm: { min: 100, max: 250 }, weightKg: { min: 30, max: 350 },
    bodyFatPercentage: { min: 2, max: 75 }, restingHeartRateBpm: { min: 30, max: 220 },
    measurementCm: { min: 10, max: 300 }, trainingDaysPerWeek: { min: 0, max: 7 },
    sessionMinutes: { min: 5, max: 300 }, averageSleepMinutes: { min: 0, max: 1440 },
  },
};

let profile;
let publicPatch;

function makeProfile() {
  return {
    account: { id: "user-1", email: "nour@example.com", username: "nour", language: "en", country: "EG", timezone: "Africa/Cairo", onboardingStatus: "completed", onboardingStep: null },
    userProfile: { firstName: "Nour", lastName: "Ibrahim", displayName: "Nour", bio: "Building healthier habits.", profilePhotoUrl: null },
    bodyProfile: {
      birthDate: "2000-06-15", sexForCalculation: "MALE", preferredUnitSystem: "METRIC", heightCm: 178,
      startingWeightKg: 82.5, activityLevel: "MODERATELY_ACTIVE", healthProfile: null, nutritionProfile: null,
      trainingProfile: null, currentBodyState: { id: "entry-1", recordedAt: "2026-08-31T10:00:00.000Z", weightKg: 81.8, measurements: [] },
    },
    coachingPreferences: null,
  };
}

describe("ProfilePage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "token",
      user: { id: "user-1", username: "nour", onboardingStatus: "in_progress", onboardingStep: 3 },
    });
    profile = makeProfile();
    publicPatch = null;
    server.use(
      http.get("*/api/profiles/config", () => HttpResponse.json({ data: config })),
      http.get("*/api/profiles/me", () => HttpResponse.json({ data: profile })),
      http.patch("*/api/profiles/me/public", async ({ request }) => {
        publicPatch = await request.json();
        profile = { ...profile, userProfile: { ...profile.userProfile, ...publicPatch } };
        return HttpResponse.json({ data: profile.userProfile });
      })
    );
  });

  it("shows a useful summary without exposing every private field", async () => {
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByRole("heading", { name: "Nour" })).toBeInTheDocument();
    expect(screen.getByText("81.8 kg")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("178 cm")).toBeInTheDocument();
    expect(screen.getByText("Moderately Active")).toBeInTheDocument();
    expect(screen.getByText("Bit says")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Health & safety" })).toBeInTheDocument();
    expect(screen.queryByText("Date of birth")).not.toBeInTheDocument();
  });

  it("reconciles routing state with the server profile", async () => {
    profile = {
      ...profile,
      account: { ...profile.account, onboardingStatus: "not_started", onboardingStep: 1 },
    };

    renderWithProviders(<ProfilePage />);
    await screen.findByRole("heading", { name: "Nour" });

    await waitFor(() => {
      expect(useAuthStore.getState().user.onboardingStatus).toBe("not_started");
      expect(useAuthStore.getState().user.onboardingStep).toBe(1);
    });
  });

  it("opens one focused layer and saves public details", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await user.click(await screen.findByRole("button", { name: "Edit Personal details" }));

    const displayName = screen.getByLabelText("Display name");
    await user.clear(displayName);
    await user.type(displayName, "Nour I.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(publicPatch?.displayName).toBe("Nour I."));
    expect(await screen.findByRole("heading", { name: "Nour I." })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Personal details editor" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Personal details" }));
    expect(await screen.findByRole("complementary", { name: "Personal details editor" })).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Nour I.");
  });

  it("validates close to the field before sending", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await user.click(await screen.findByRole("button", { name: "Edit Personal details" }));
    const firstName = screen.getByLabelText("First name");
    await user.clear(firstName);
    await user.type(firstName, "N");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Use at least 2 characters.")).toBeInTheDocument();
    expect(publicPatch).toBeNull();
  });
});
