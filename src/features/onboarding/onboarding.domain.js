const VALID_STATUSES = new Set(["not_started", "in_progress", "completed"]);

export const GOAL_COPY = {
  LOSE_WEIGHT: { label: "Lose weight", note: "Move toward a lighter, sustainable baseline." },
  MAINTAIN_WEIGHT: { label: "Maintain", note: "Protect the rhythm and progress you already have." },
  GAIN_WEIGHT: { label: "Gain weight", note: "Build toward a stronger, supported body." },
  BUILD_MUSCLE: { label: "Build muscle", note: "Make strength and lean mass the priority." },
  IMPROVE_FITNESS: { label: "Feel fitter", note: "Improve energy, movement, and capacity." },
};

export const ACTIVITY_COPY = {
  SEDENTARY: { label: "Mostly seated", note: "Little planned exercise right now." },
  LIGHTLY_ACTIVE: { label: "Lightly active", note: "Movement or exercise 1–2 days each week." },
  MODERATELY_ACTIVE: { label: "Moderately active", note: "Exercise around 3–4 days each week." },
  VERY_ACTIVE: { label: "Very active", note: "Hard exercise, sport, or physical work 5+ days." },
};

export function getOnboardingStatus(user) {
  if (VALID_STATUSES.has(user?.onboardingStatus)) return user.onboardingStatus;
  if (user?.on_boarding === false || user?.onboardingCompleted === false) return "not_started";
  if (user?.on_boarding === true || user?.onboardingCompleted === true) return "completed";
  return "completed";
}

export function getOnboardingPath(user) {
  const status = getOnboardingStatus(user);
  if (status === "not_started") return "/onboarding";
  if (status === "in_progress") {
    const step = Math.min(3, Math.max(1, Number(user?.onboardingStep) || 1));
    return `/onboarding/${step}`;
  }
  return "/app/home";
}

export const poundsToKg = (pounds) => Math.round((Number(pounds) / 2.2046226218) * 10) / 10;
export const kgToPounds = (kg) => Math.round(Number(kg) * 2.2046226218 * 10) / 10;

export const imperialHeightToCm = (feet, inches) =>
  Math.round((Number(feet) * 30.48 + Number(inches) * 2.54) * 10) / 10;

export function cmToImperial(cm) {
  const totalInches = Number(cm) / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function buildStepOnePayload(values) {
  const imperial = values.preferredUnitSystem === "IMPERIAL";
  const [dateYear, dateMonth, dateDay] = values.birthDate
    ? values.birthDate.split("-").map(Number)
    : [values.birthYear, values.birthMonth, values.birthDay].map(Number);

  return {
    firstName: values.firstName?.trim(),
    lastName: values.lastName?.trim(),
    birthYear: dateYear,
    birthMonth: dateMonth,
    birthDay: dateDay,
    adultConfirmed: Boolean(values.adultConfirmed),
    sexForCalculation: values.sexForCalculation,
    preferredUnitSystem: values.preferredUnitSystem,
    heightCm: imperial
      ? imperialHeightToCm(values.heightFeet, values.heightInches)
      : Number(values.heightCm),
    currentWeightKg: imperial
      ? poundsToKg(values.currentWeightLb)
      : Number(values.currentWeightKg),
  };
}

export function buildStepTwoPayload(values) {
  const imperial = values.preferredUnitSystem === "IMPERIAL";
  const targetIsHidden = values.goalType === "MAINTAIN_WEIGHT";
  const rawTarget = imperial ? values.targetWeightLb : values.targetWeightKg;
  const hasTarget = rawTarget !== "" && rawTarget !== null && rawTarget !== undefined && !Number.isNaN(rawTarget);

  return {
    goalType: values.goalType,
    ...(targetIsHidden
      ? {}
      : { targetWeightKg: hasTarget ? (imperial ? poundsToKg(rawTarget) : Number(rawTarget)) : null }),
    targetDate: values.targetDate || null,
    activityLevel: values.activityLevel,
  };
}

export function savedDataToFormValues(data = {}) {
  const imperialHeight = data.heightCm ? cmToImperial(data.heightCm) : { feet: "", inches: "" };
  const birthDate = data.birthYear && data.birthMonth && data.birthDay
    ? `${data.birthYear}-${String(data.birthMonth).padStart(2, "0")}-${String(data.birthDay).padStart(2, "0")}`
    : "";
  return {
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    birthYear: data.birthYear || "",
    birthDate,
    birthMonth: data.birthMonth || "",
    birthDay: data.birthDay || "",
    adultConfirmed: Boolean(data.adultConfirmed),
    sexForCalculation: data.sexForCalculation || "",
    preferredUnitSystem: data.preferredUnitSystem || "METRIC",
    heightCm: data.heightCm || "",
    currentWeightKg: data.currentWeightKg || "",
    heightFeet: imperialHeight.feet,
    heightInches: imperialHeight.inches,
    currentWeightLb: data.currentWeightKg ? kgToPounds(data.currentWeightKg) : "",
    goalType: data.goalType || "",
    targetWeightKg: data.targetWeightKg || "",
    targetWeightLb: data.targetWeightKg ? kgToPounds(data.targetWeightKg) : "",
    targetDate: data.targetDate || "",
    activityLevel: data.activityLevel || "",
  };
}
