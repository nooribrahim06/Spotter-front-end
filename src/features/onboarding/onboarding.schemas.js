import * as z from "zod";
import { ONBOARDING_CONFIG } from "./api/onboarding.api.js";

const { constraints } = ONBOARDING_CONFIG;
const currentYear = new Date().getFullYear();

export const stepOneSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(40, "First name is too long"),
  lastName: z.string().trim().min(2, "Enter your last name").max(40, "Last name is too long"),
  birthYear: z
    .number()
    .int("Enter a whole birth year")
    .min(currentYear - constraints.maximumAge, `You must be ${constraints.maximumAge} or younger`)
    .max(currentYear - constraints.minimumAge, `You must be at least ${constraints.minimumAge}`),
  birthMonth: z.number().int("Enter a whole month").min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  birthDay: z.number().int("Enter a whole day").min(1, "Day must be between 1 and 31").max(31, "Day must be between 1 and 31"),
  adultConfirmed: z.literal(true, { error: "Confirm that you are 18 or older" }),
  sexForCalculation: z.enum(["MALE", "FEMALE"], { error: "Choose the option used for fitness calculations" }),
  preferredUnitSystem: z.enum(["METRIC", "IMPERIAL"]),
  heightCm: z
    .number()
    .min(constraints.minimumHeightCm, `Height must be at least ${constraints.minimumHeightCm} cm`)
    .max(constraints.maximumHeightCm, `Height must be no more than ${constraints.maximumHeightCm} cm`),
  currentWeightKg: z
    .number()
    .min(constraints.minimumWeightKg, `Weight must be at least ${constraints.minimumWeightKg} kg`)
    .max(constraints.maximumWeightKg, `Weight must be no more than ${constraints.maximumWeightKg} kg`),
}).superRefine((data, context) => {
  const { birthYear, birthMonth, birthDay } = data;
  const validDateParts = Number.isInteger(birthYear)
    && Number.isInteger(birthMonth)
    && Number.isInteger(birthDay)
    && birthMonth >= 1
    && birthMonth <= 12
    && birthDay >= 1
    && birthDay <= 31;

  if (!validDateParts) return;

  const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
  const isRealDate = birthDate.getUTCFullYear() === birthYear
    && birthDate.getUTCMonth() === birthMonth - 1
    && birthDate.getUTCDate() === birthDay;

  if (!isRealDate) {
    context.addIssue({
      code: "custom",
      path: ["birthDay"],
      message: "Enter a valid date of birth",
    });
    return;
  }

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const birthdayHasPassed = today.getMonth() + 1 > birthMonth
    || (today.getMonth() + 1 === birthMonth && today.getDate() >= birthDay);
  if (!birthdayHasPassed) age -= 1;

  if (age < constraints.minimumAge) {
    context.addIssue({ code: "custom", path: ["birthYear"], message: `You must be at least ${constraints.minimumAge}` });
  } else if (age > constraints.maximumAge) {
    context.addIssue({ code: "custom", path: ["birthYear"], message: `You must be ${constraints.maximumAge} or younger` });
  }
});

export const stepTwoSchema = z
  .object({
    goalType: z.enum(ONBOARDING_CONFIG.goalTypes, { error: "Choose your primary goal" }),
    targetWeightKg: z.number().min(30).max(350).nullable().optional(),
    targetDate: z.string().nullable().optional(),
    activityLevel: z.enum(ONBOARDING_CONFIG.activityLevels, { error: "Choose your activity level" }),
  })
  .superRefine((data, context) => {
    if (["LOSE_WEIGHT", "GAIN_WEIGHT"].includes(data.goalType) && !data.targetWeightKg) {
      context.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "Add a target weight for this goal",
      });
    }

    if (data.goalType === "MAINTAIN_WEIGHT" && "targetWeightKg" in data) {
      context.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "Target weight is not used for maintenance",
      });
    }

    if (data.targetDate) {
      const target = new Date(`${data.targetDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(target.getTime()) || target <= today) {
        context.addIssue({
          code: "custom",
          path: ["targetDate"],
          message: "Choose a future target date",
        });
      }
    }
  });
