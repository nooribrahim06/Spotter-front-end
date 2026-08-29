import { describe, expect, it } from "vitest";
import {
  buildStepOnePayload,
  buildStepTwoPayload,
  cmToImperial,
  getOnboardingPath,
  getOnboardingStatus,
  imperialHeightToCm,
  kgToPounds,
  poundsToKg,
} from "../onboarding.domain.js";
import { stepOneSchema } from "../onboarding.schemas.js";

describe("onboarding domain", () => {
  it("routes each onboarding status to the correct destination", () => {
    expect(getOnboardingPath({ onboardingStatus: "not_started" })).toBe("/onboarding");
    expect(getOnboardingPath({ onboardingStatus: "in_progress", onboardingStep: 2 })).toBe("/onboarding/2");
    expect(getOnboardingPath({ onboardingStatus: "completed" })).toBe("/app/home");
  });

  it("supports the legacy on_boarding boolean returned during transition", () => {
    expect(getOnboardingStatus({ on_boarding: false })).toBe("not_started");
    expect(getOnboardingStatus({ on_boarding: true })).toBe("completed");
  });

  it("converts imperial measurements to API metric values", () => {
    const payload = buildStepOnePayload({
      firstName: "Noor",
      lastName: "Ibrahim",
      birthDate: "2002-08-27",
      adultConfirmed: true,
      sexForCalculation: "MALE",
      preferredUnitSystem: "IMPERIAL",
      heightFeet: 5,
      heightInches: 10,
      currentWeightLb: 181.9,
    });

    expect(payload.heightCm).toBe(177.8);
    expect(payload.currentWeightKg).toBe(82.5);
    expect(payload.birthYear).toBe(2002);
    expect(payload.birthMonth).toBe(8);
    expect(payload.birthDay).toBe(27);
    expect(imperialHeightToCm(6, 0)).toBe(182.9);
    expect(cmToImperial(177.8)).toEqual({ feet: 5, inches: 10 });
    expect(poundsToKg(220.462)).toBe(100);
    expect(kgToPounds(100)).toBe(220.5);
  });

  it("rejects a calendar date that does not exist", () => {
    const result = stepOneSchema.safeParse({
      firstName: "Noor",
      lastName: "Ibrahim",
      birthYear: 2002,
      birthMonth: 2,
      birthDay: 31,
      adultConfirmed: true,
      sexForCalculation: "MALE",
      preferredUnitSystem: "METRIC",
      heightCm: 178,
      currentWeightKg: 82.5,
    });

    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ["birthDay"], message: "Enter a valid date of birth" }),
    ]));
  });

  it("omits target weight for maintenance goals", () => {
    const payload = buildStepTwoPayload({
      goalType: "MAINTAIN_WEIGHT",
      preferredUnitSystem: "METRIC",
      targetWeightKg: 75,
      targetDate: "",
      activityLevel: "LIGHTLY_ACTIVE",
    });

    expect(payload).not.toHaveProperty("targetWeightKg");
  });
});
