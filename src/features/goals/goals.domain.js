export const GOAL_TYPES = [
  "LOSE_WEIGHT",
  "MAINTAIN_WEIGHT",
  "GAIN_WEIGHT",
  "BUILD_MUSCLE",
  "IMPROVE_FITNESS",
];

export const GOAL_TYPE_META = {
  LOSE_WEIGHT: {
    label: "Lose weight",
    shortLabel: "Lighter",
    description: "Move toward a weight that feels right for you.",
    icon: "down",
  },
  MAINTAIN_WEIGHT: {
    label: "Maintain weight",
    shortLabel: "Steady",
    description: "Build consistency and hold your healthy range.",
    icon: "balance",
  },
  GAIN_WEIGHT: {
    label: "Gain weight",
    shortLabel: "Stronger",
    description: "Add healthy weight with purpose and patience.",
    icon: "up",
  },
  BUILD_MUSCLE: {
    label: "Build muscle",
    shortLabel: "Build",
    description: "Focus your training on strength and lean mass.",
    icon: "strength",
  },
  IMPROVE_FITNESS: {
    label: "Improve fitness",
    shortLabel: "Move",
    description: "Feel fitter, move better, and grow your capacity.",
    icon: "pulse",
  },
};

export const WEIGHT_REQUIRED_TYPES = new Set(["LOSE_WEIGHT", "GAIN_WEIGHT"]);

export function goalTypeMeta(goalType) {
  return GOAL_TYPE_META[goalType] || {
    label: "Personal goal",
    shortLabel: "Goal",
    description: "A direction chosen for your journey.",
    icon: "pulse",
  };
}

export function normalizeGoalPayload(values) {
  const goalType = values.goalType;
  const rawWeight = values.targetWeightKg;
  const hasWeight = rawWeight !== "" && rawWeight != null;

  return {
    goalType,
    targetWeightKg:
      goalType === "MAINTAIN_WEIGHT" || !hasWeight
        ? null
        : Number(rawWeight),
    targetDate: values.targetDate || null,
  };
}

export function validateGoalPayload(payload) {
  const errors = {};

  if (!GOAL_TYPES.includes(payload.goalType)) {
    errors.goalType = "Choose the direction you want to work toward.";
  }

  if (WEIGHT_REQUIRED_TYPES.has(payload.goalType) && payload.targetWeightKg == null) {
    errors.targetWeightKg = "Add a target weight for this goal.";
  }

  if (payload.targetWeightKg != null) {
    if (!Number.isFinite(payload.targetWeightKg)) {
      errors.targetWeightKg = "Enter a valid target weight.";
    } else if (payload.targetWeightKg < 30 || payload.targetWeightKg > 350) {
      errors.targetWeightKg = "Choose a target between 30 and 350 kg.";
    }
  }

  if (payload.targetDate) {
    const utcToday = new Date().toISOString().slice(0, 10);
    if (payload.targetDate <= utcToday) {
      errors.targetDate = "Choose a future date, or leave it open.";
    }
  }

  return errors;
}

export function formatGoalDate(value, options = {}) {
  if (!value) return null;
  const date = new Date(value.includes?.("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: options.short ? "short" : "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function goalTargetCopy(goal) {
  if (goal.goalType === "MAINTAIN_WEIGHT") return "Keep your healthy rhythm";
  if (goal.targetWeightKg != null) return `${goal.targetWeightKg} kg destination`;
  return "Build the habit, then raise the bar";
}

export function partitionGoals(goals = []) {
  return goals.reduce(
    (groups, goal) => {
      if (goal.status === "DRAFT") groups.drafts.push(goal);
      if (["COMPLETED", "CANCELLED"].includes(goal.status)) groups.history.push(goal);
      return groups;
    },
    { drafts: [], history: [] }
  );
}

export function measurementLabel(type) {
  return String(type || "Measurement")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
