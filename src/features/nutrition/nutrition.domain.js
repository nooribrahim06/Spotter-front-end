/**
 * Spotter — Nutrition Domain Logic
 *
 * Pure functions with no React dependency.
 * Preview calculations are for client-side display only —
 * the backend response is always authoritative.
 */

/* ── Meal Type Constants ─────────────────────────────────── */

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export const MEAL_TYPE_META = {
  BREAKFAST: { label: "Breakfast", icon: "sunrise", defaultHour: 8 },
  LUNCH: { label: "Lunch", icon: "sun", defaultHour: 13 },
  DINNER: { label: "Dinner", icon: "moon", defaultHour: 19 },
  SNACK: { label: "Snack", icon: "cookie", defaultHour: 16 },
};

/**
 * Get label, icon, and default hour for a meal type.
 * Falls back safely for unknown types.
 */
export function mealTypeMeta(mealType) {
  return (
    MEAL_TYPE_META[mealType] || {
      label: "Meal",
      icon: "sun",
      defaultHour: 12,
    }
  );
}

/* ── Preview Calculations ────────────────────────────────── */

/**
 * Calculate nutrition preview for a food at a given quantity.
 * Food nutrition is stored per 100 grams.
 *
 * @param {Food} food
 * @param {number} quantityGrams
 * @returns {{ calories: number, proteinGrams: number, carbohydrateGrams: number, fatGrams: number }}
 */
export function calculateFoodPreview(food, quantityGrams) {
  const factor = quantityGrams / 100;
  return {
    calories: food.caloriesPer100g * factor,
    proteinGrams: food.proteinGramsPer100g * factor,
    carbohydrateGrams: food.carbohydrateGramsPer100g * factor,
    fatGrams: food.fatGramsPer100g * factor,
  };
}

/**
 * Calculate nutrition preview for a recipe at a given serving count.
 * Recipe nutrition is stored per serving.
 *
 * @param {RecipeSummary} recipe
 * @param {number} servings
 * @returns {{ calories: number, proteinGrams: number, carbohydrateGrams: number, fatGrams: number }}
 */
export function calculateRecipePreview(recipe, servings) {
  return {
    calories: recipe.caloriesPerServing * servings,
    proteinGrams: recipe.proteinGramsPerServing * servings,
    carbohydrateGrams: recipe.carbohydrateGramsPerServing * servings,
    fatGrams: recipe.fatGramsPerServing * servings,
  };
}

/* ── Draft Totals ────────────────────────────────────────── */

/**
 * Sum up nutrition from all draft items for display.
 *
 * @param {MealItemInput[]} items - Draft items
 * @param {Map<string, Food>} foodMap - foodId → Food lookup
 * @param {Map<string, RecipeSummary>} recipeMap - recipeId → RecipeSummary lookup
 * @returns {{ calories: number, proteinGrams: number|null, carbohydrateGrams: number|null, fatGrams: number|null, macrosComplete: boolean }}
 */
export function calculateDraftTotals(items, foodMap, recipeMap) {
  let calories = 0;
  let proteinGrams = 0;
  let carbohydrateGrams = 0;
  let fatGrams = 0;
  let macrosComplete = true;

  for (const item of items) {
    if (item.itemType === "FOOD") {
      const food = foodMap.get(item.foodId);
      if (food) {
        const preview = calculateFoodPreview(food, item.quantityGrams);
        calories += preview.calories;
        proteinGrams += preview.proteinGrams;
        carbohydrateGrams += preview.carbohydrateGrams;
        fatGrams += preview.fatGrams;
      }
    } else if (item.itemType === "RECIPE") {
      const recipe = recipeMap.get(item.recipeId);
      if (recipe) {
        const preview = calculateRecipePreview(recipe, item.servings);
        calories += preview.calories;
        proteinGrams += preview.proteinGrams;
        carbohydrateGrams += preview.carbohydrateGrams;
        fatGrams += preview.fatGrams;
      }
    } else if (item.itemType === "QUICK") {
      calories += item.calories;
      if (item.proteinGrams != null) {
        proteinGrams += item.proteinGrams;
      } else {
        macrosComplete = false;
      }
      if (item.carbohydrateGrams != null) {
        carbohydrateGrams += item.carbohydrateGrams;
      } else {
        macrosComplete = false;
      }
      if (item.fatGrams != null) {
        fatGrams += item.fatGrams;
      } else {
        macrosComplete = false;
      }
    }
  }

  return {
    calories,
    proteinGrams: macrosComplete ? proteinGrams : null,
    carbohydrateGrams: macrosComplete ? carbohydrateGrams : null,
    fatGrams: macrosComplete ? fatGrams : null,
    macrosComplete,
  };
}

/* ── Edit Flow Conversion ────────────────────────────────── */

/**
 * Convert a response MealItem back to a MealItemInput for editing.
 * Used when loading an existing meal into the draft store.
 *
 * @param {MealItem} item
 * @returns {MealItemInput}
 */
export function mealItemToInput(item) {
  if (item.itemType === "FOOD") {
    return {
      itemType: "FOOD",
      foodId: item.foodId,
      quantityGrams: item.quantityGrams,
    };
  }

  if (item.itemType === "RECIPE") {
    return {
      itemType: "RECIPE",
      recipeId: item.recipeId,
      servings: item.servings,
    };
  }

  return {
    itemType: "QUICK",
    itemName: item.itemName,
    calories: item.calories,
    proteinGrams: item.proteinGrams,
    carbohydrateGrams: item.carbohydrateGrams,
    fatGrams: item.fatGrams,
  };
}

/* ── Display Helpers ─────────────────────────────────────── */

/**
 * Format a nutrient value for display.
 * Returns "—" for null values (never displays null as zero).
 *
 * @param {number|null} value
 * @param {string} [unit="g"]
 * @returns {string}
 */
export function formatNutrient(value, unit = "g") {
  if (value == null) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}

/**
 * Format a calorie value for display.
 * Returns "—" for null values.
 *
 * @param {number|null} value
 * @returns {string}
 */
export function formatCalories(value) {
  if (value == null) return "—";
  return `${Math.round(value)}`;
}

/* ── Date Helpers ────────────────────────────────────────── */

/**
 * Get today's date as a YYYY-MM-DD string in the user's local timezone.
 * @returns {string}
 */
export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Format an ISO datetime string to a human-readable time (e.g. "1:30 PM").
 *
 * @param {string} isoString
 * @returns {string}
 */
export function formatMealTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Build a default occurredAt ISO string for a new meal.
 * Uses today's date with the meal type's default hour.
 *
 * @param {string} mealType
 * @returns {string}
 */
export function defaultOccurredAt(mealType) {
  const meta = mealTypeMeta(mealType);
  const now = new Date();
  const defaultTime = new Date(now);
  defaultTime.setHours(meta.defaultHour, 0, 0, 0);

  // If the default time is in the future, use current time instead
  if (defaultTime > now) {
    return now.toISOString();
  }

  return defaultTime.toISOString();
}

/**
 * Format a date string (YYYY-MM-DD) for display (e.g. "August 31, 2026").
 *
 * @param {string} dateString - YYYY-MM-DD
 * @param {object} [options]
 * @param {boolean} [options.short] - Use abbreviated month
 * @returns {string|null}
 */
export function formatDateLabel(dateString, options = {}) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: options.short ? "short" : "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Check whether a date string represents today.
 *
 * @param {string} dateString - YYYY-MM-DD
 * @returns {boolean}
 */
export function isToday(dateString) {
  return dateString === todayDateString();
}

/**
 * Converts an ISO string into YYYY-MM-DDTHH:mm format for datetime-local inputs.
 */
export function isoToDateTimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Converts a datetime-local input value into an ISO string.
 */
export function dateTimeLocalToIso(localString) {
  if (!localString) return "";
  const d = new Date(localString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

