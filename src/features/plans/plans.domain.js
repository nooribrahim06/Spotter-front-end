/**
 * Spotter — Plans Domain Logic
 *
 * Pure functions with no React dependency.
 * Backend response is always authoritative — never recalculate targets frontend-side.
 */
import { calendarDate } from '../daily-summary/daily-summary.domain.js';

/* ── Status ──────────────────────────────────────────────── */

export function planStatusLabel(status) {
  const map = {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    SUPERSEDED: 'Replaced',
    ENDED: 'Ended',
    DISCARDED: 'Discarded',
  };
  return map[status] ?? status;
}

export function planStatusVariant(status) {
  const map = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    SUPERSEDED: 'replaced',
    ENDED: 'ended',
    DISCARDED: 'discarded',
  };
  return map[status] ?? 'default';
}

export function isTerminalStatus(status) {
  return ['SUPERSEDED', 'ENDED', 'DISCARDED'].includes(status);
}

/* ── Dates ───────────────────────────────────────────────── */

/**
 * Today as YYYY-MM-DD in the plan's timezone.
 * Falls back to local date if no timezone provided.
 */
export function todayInPlanTimezone(timezone) {
  return calendarDate(new Date(), timezone);
}

/**
 * Whether today (in the plan's timezone) falls within the plan's coverage.
 * Uses YYYY-MM-DD string comparison — date-only semantics, never timezone-shifted.
 */
export function isActivatable(plan, today) {
  if (!plan?.startDate || !plan?.endDate || !today) return false;
  return plan.startDate <= today && today <= plan.endDate;
}

/**
 * Whether the plan's coverage has passed (date-only, conservative client-side check).
 * Backend is authoritative for actual status transitions.
 */
export function isPastCoverage(plan, today) {
  if (!plan?.endDate || !today) return false;
  return plan.endDate < today;
}

export function formatPlanDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const parse = (d) => new Date(`${d}T12:00:00`);
  const options = { month: 'short', day: 'numeric' };
  const startFmt = parse(startDate).toLocaleDateString(undefined, options);
  const endFmt = parse(endDate).toLocaleDateString(undefined, {
    ...options,
    year: parse(endDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
  return `${startFmt} – ${endFmt}`;
}

export function formatDateOnly(dateString) {
  if (!dateString) return '';
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatInstant(isoString) {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return ''; }
}

/* ── Week / Day ──────────────────────────────────────────── */

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEK_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Day index 0 = Monday, 6 = Sunday */
export function weekDayLabel(index) { return WEEK_DAYS[index] ?? ''; }
export function weekDayShort(index) { return WEEK_SHORT[index] ?? ''; }

/**
 * Sort plan days by day-of-week into Mon–Sun order.
 * Accepts dayOfWeek as 1-7 (Mon=1) or 0-6 (Mon=0).
 */
export function sortPlanDays(days = []) {
  return [...days].sort((a, b) => {
    const normalize = (d) => {
      const v = d.dayOfWeek ?? d.dayIndex ?? 0;
      // If using 1-7 (Mon=1), convert to 0-6
      return v >= 1 && v <= 7 ? v - 1 : v;
    };
    return normalize(a) - normalize(b);
  });
}

/** Normalized day index (0=Mon, 6=Sun) from a plan day object */
export function dayIndex(planDay) {
  const v = planDay?.dayOfWeek ?? planDay?.dayIndex ?? 0;
  return v >= 1 && v <= 7 ? v - 1 : v;
}

/* ── Workout ─────────────────────────────────────────────── */

export function slotLabel(slot) {
  const map = {
    MORNING: 'Morning',
    AFTERNOON: 'Afternoon',
    EVENING: 'Evening',
    ANYTIME: 'Flexible',
  };
  return map[slot] ?? 'Any time';
}

/**
 * Build a concise human-readable prescription summary for one exercise.
 * Only includes non-null measurements. 0 is a valid value; null means unknown.
 */
export function prescriptionSummary(exercise) {
  const parts = [];
  const { setsCount, repMin, repMax, weightKg, durationSeconds, distanceMeters, restSeconds } = exercise;

  if (setsCount != null) {
    const reps = repMin != null && repMax != null
      ? (repMin === repMax ? `${repMin}` : `${repMin}–${repMax}`)
      : repMin != null ? `${repMin}+` : repMax != null ? `up to ${repMax}` : null;
    parts.push(reps ? `${setsCount} × ${reps} reps` : `${setsCount} sets`);
  } else if (repMin != null || repMax != null) {
    const reps = repMin != null && repMax != null
      ? (repMin === repMax ? `${repMin}` : `${repMin}–${repMax}`)
      : repMin != null ? `${repMin}+` : `up to ${repMax}`;
    parts.push(`${reps} reps`);
  }

  if (weightKg != null) parts.push(`${weightKg} kg`);

  if (durationSeconds != null) {
    const m = Math.floor(durationSeconds / 60);
    const s = durationSeconds % 60;
    parts.push(m > 0 && s > 0 ? `${m} min ${s} sec` : m > 0 ? `${m} min` : `${s} sec`);
  }

  if (distanceMeters != null) {
    parts.push(distanceMeters >= 1000 ? `${distanceMeters / 1000} km` : `${distanceMeters} m`);
  }

  if (restSeconds != null) parts.push(`${restSeconds}s rest`);

  return parts.join(' · ');
}

/* ── Nutrition ───────────────────────────────────────────── */

export function nutritionPlanStyleLabel(style) {
  const map = {
    EXACT_MEALS: 'Exact meals',
    FLEXIBLE_MEALS: 'Flexible meals',
    MACRO_BASED: 'Macro-based',
    SIMPLE_GUIDANCE: 'Simple guidance',
  };
  return map[style] ?? humanize(style);
}

/** Whether this plan style shows explicit meal options */
export function styleHasMealOptions(style) {
  return style === 'EXACT_MEALS' || style === 'FLEXIBLE_MEALS';
}

export function formatNutrient(value, unit = 'g') {
  if (value == null) return '—';
  return `${Math.round(value * 10) / 10}${unit}`;
}

export function formatCalories(value) {
  if (value == null) return '—';
  return Math.round(value).toLocaleString();
}

/* ── Readiness ───────────────────────────────────────────── */

const READINESS_INFO = {
  // Account
  TIMEZONE:                          { route: '/app/profile',          label: 'Set your timezone',              description: "We need this to schedule workouts and meals to the right days for you.",                                                  icon: 'clock',    optional: false },
  // Goals
  ACTIVE_GOAL:                       { route: '/app/plans',            label: 'Add an active goal',             description: "Set a goal (lose weight, build muscle, improve fitness…) so Spotter knows what to aim for.",                            icon: 'target',   optional: false },
  TARGET_WEIGHT:                     { route: '/app/plans',            label: 'Set a target weight on your goal', description: "Your current goal needs a target weight so we can calibrate calories and macros.",                                       icon: 'target',   optional: false },
  // Body
  BODY_PROFILE:                      { route: '/app/profile',          label: 'Body basics',                    description: "Your height, weight, sex and birth date are needed to calculate energy targets.",                                       icon: 'person',   optional: false },
  BIRTH_DATE:                        { route: '/app/profile',          label: 'Date of birth',                  description: "Age affects your metabolic rate and exercise recommendations.",                                                         icon: 'person',   optional: false },
  SEX_FOR_CALCULATION:               { route: '/app/profile',          label: 'Biological sex',                 description: "Used only for energy and macro calculations.",                                                                         icon: 'person',   optional: false },
  HEIGHT:                            { route: '/app/profile',          label: 'Your height',                    description: "Needed to calculate your total daily energy expenditure.",                                                              icon: 'person',   optional: false },
  ACTIVITY_LEVEL:                    { route: '/app/profile',          label: 'Activity level',                 description: "How active you are outside of workouts shapes your baseline calorie needs.",                                            icon: 'person',   optional: false },
  CURRENT_WEIGHT:                    { route: '/app/progress?checkIn=1', label: 'Current weight',              description: "Log a weight check-in so Spotter has your starting point.",                                                             icon: 'scale',    optional: false },
  // Health
  HEALTH_PROFILE:                    { route: '/app/profile',          label: 'Health profile',                 description: "Complete your health section so Spotter can plan safely around any conditions or limitations.",                         icon: 'heart',    optional: false },
  HEALTH_CONDITIONS:                 { route: '/app/profile',          label: 'Health conditions',              description: "Any diagnosed conditions we should factor in.",                                                                        icon: 'heart',    optional: false },
  MOVEMENT_LIMITATIONS:              { route: '/app/profile',          label: 'Movement limitations',           description: "Injuries or physical restrictions we should work around.",                                                             icon: 'heart',    optional: false },
  SPECIAL_PLANNING_STATES:           { route: '/app/profile',          label: 'Special planning states',        description: "Conditions like pregnancy that change how Spotter plans for you.",                                                     icon: 'heart',    optional: false },
  // Training
  TRAINING_PROFILE:                  { route: '/app/profile',          label: 'Training preferences',           description: "Your gym setup, experience and available days shape the whole training plan.",                                         icon: 'dumbbell', optional: false },
  TRAINING_EXPERIENCE:               { route: '/app/profile',          label: 'Training experience level',      description: "Beginner, intermediate or advanced — this sets the difficulty and volume.",                                            icon: 'dumbbell', optional: false },
  TRAINING_DAYS_PER_WEEK:            { route: '/app/profile',          label: 'Training days per week',         description: "How many days you want to train each week.",                                                                           icon: 'dumbbell', optional: false },
  AVAILABLE_TRAINING_DAYS:           { route: '/app/profile',          label: 'Available training days',        description: "Which specific days of the week you can train.",                                                                       icon: 'dumbbell', optional: false },
  SESSION_DURATION:                  { route: '/app/profile',          label: 'Session duration',               description: "How long you typically have for a workout session.",                                                                   icon: 'dumbbell', optional: false },
  TRAINING_ENVIRONMENT:              { route: '/app/profile',          label: 'Training environment',           description: "Home gym, commercial gym or outdoor — equipment varies significantly.",                                               icon: 'dumbbell', optional: false },
  TRAINING_DAYS_EXCEED_AVAILABILITY: { route: '/app/profile',          label: 'Training days conflict',         description: "Your training days exceed the days you marked available. Please fix this before continuing.",                          icon: 'warning',  optional: false },
  // Nutrition
  NUTRITION_PROFILE:                 { route: '/app/profile',          label: 'Nutrition preferences',          description: "Dietary preferences, allergies and meal style shape your meal plan.",                                                  icon: 'meals',    optional: false },
  DIETARY_PREFERENCES:               { route: '/app/profile',          label: 'Dietary preferences',            description: "Vegetarian, vegan, keto — tell us your approach.",                                                                    icon: 'meals',    optional: false },
  FOOD_ALLERGIES:                    { route: '/app/profile',          label: 'Food allergies',                 description: "Ingredients we must never include in your plan.",                                                                     icon: 'meals',    optional: false },
  FOOD_INTOLERANCES:                 { route: '/app/profile',          label: 'Food intolerances',              description: "Foods you prefer to avoid but aren't strictly allergic to.",                                                          icon: 'meals',    optional: false },
  NUTRITION_PLAN_STYLE:              { route: '/app/profile',          label: 'Nutrition plan style',           description: "Choose between exact meals, flexible meals, or macro-based guidance.",                                                icon: 'meals',    optional: false },
  MEALS_PER_DAY:                     { route: '/app/profile',          label: 'Meals per day',                  description: "How many main meals you eat daily.",                                                                                   icon: 'meals',    optional: false },
  SNACKS_PER_DAY:                    { route: '/app/profile',          label: 'Snacks per day',                 description: "How many snacks you want included in your daily plan.",                                                                icon: 'meals',    optional: false },
  UNSUPPORTED_NUTRITION_PLAN_STYLE:  { route: '/app/profile',          label: 'Nutrition plan style',           description: "Your current nutrition style isn't supported yet. Choose a different one to continue.",                                icon: 'warning',  optional: false },
  UNSUPPORTED_MAIN_MEAL_COUNT:       { route: '/app/profile',          label: 'Meal count',                     description: "Your current meal count isn't in a supported range. Please update it.",                                               icon: 'warning',  optional: false },
  UNSUPPORTED_SNACK_COUNT:           { route: '/app/profile',          label: 'Snack count',                    description: "Your current snack count isn't in a supported range. Please update it.",                                              icon: 'warning',  optional: false },
  // Optional enrichment
  FOOD_PREFERENCES:                  { route: '/app/profile',          label: 'Food preferences',               description: "Cuisines and ingredients you enjoy — makes meal suggestions more personal.",                                           icon: 'meals',    optional: true },
  COOKING_SKILL:                     { route: '/app/profile',          label: 'Cooking skill level',            description: "Helps us suggest recipes that match your confidence in the kitchen.",                                                  icon: 'meals',    optional: true },
  FOOD_BUDGET:                       { route: '/app/profile',          label: 'Food budget',                    description: "Lets us suggest affordable meal options within your range.",                                                           icon: 'meals',    optional: true },
};

export function readinessCodeInfo(code) {
  return READINESS_INFO[code] ?? { route: '/app/profile', label: 'Complete your profile', description: 'Some profile information is needed before generating a plan.', icon: 'person', optional: false };
}


export function isReadinessBlocked(context) {
  return Boolean(context?.blocked || context?.blockReason);
}

export function isReadinessReady(context) {
  if (!context) return false;
  if (isReadinessBlocked(context)) return false;
  if (context.ready !== undefined) return Boolean(context.ready);
  const missing = context.missingRequired ?? [];
  const issues = context.issues ?? [];
  return missing.length === 0 && issues.length === 0;
}

export function readinessMissingRequired(context) {
  const missing = context?.missingRequired ?? [];
  const issues = context?.issues ?? [];
  // Return unified list of blocking requirement codes and issues
  return [...missing, ...issues];
}

export function readinessMissingOptional(context) {
  return context?.missingOptional ?? [];
}

export function readinessEditorType(code) {
  switch (code) {
    case 'HEALTH_PROFILE':
    case 'HEALTH_CONDITIONS':
    case 'MOVEMENT_LIMITATIONS':
    case 'SPECIAL_PLANNING_STATES':
      return 'health';

    case 'TRAINING_PROFILE':
    case 'TRAINING_EXPERIENCE':
    case 'TRAINING_DAYS_PER_WEEK':
    case 'AVAILABLE_TRAINING_DAYS':
    case 'SESSION_DURATION':
    case 'TRAINING_ENVIRONMENT':
    case 'TRAINING_DAYS_EXCEED_AVAILABILITY':
      return 'training';

    case 'NUTRITION_PROFILE':
    case 'DIETARY_PREFERENCES':
    case 'FOOD_ALLERGIES':
    case 'FOOD_INTOLERANCES':
    case 'NUTRITION_PLAN_STYLE':
    case 'MEALS_PER_DAY':
    case 'SNACKS_PER_DAY':
    case 'UNSUPPORTED_NUTRITION_PLAN_STYLE':
    case 'UNSUPPORTED_MAIN_MEAL_COUNT':
    case 'UNSUPPORTED_SNACK_COUNT':
    case 'FOOD_PREFERENCES':
    case 'COOKING_SKILL':
    case 'FOOD_BUDGET':
      return 'nutrition';

    case 'BODY_PROFILE':
    case 'BIRTH_DATE':
    case 'SEX_FOR_CALCULATION':
    case 'HEIGHT':
    case 'ACTIVITY_LEVEL':
      return 'body';

    case 'TIMEZONE':
      return 'account';

    case 'CURRENT_WEIGHT':
      return 'checkIn';

    case 'ACTIVE_GOAL':
    case 'TARGET_WEIGHT':
      return 'goal';

    default:
      return null;
  }
}

/* ── General ─────────────────────────────────────────────── */

export function humanize(value) {
  if (!value) return '';
  return String(value).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function planTitle(plan) {
  return plan?.title || 'Your Plan';
}
