import { apiClient } from "../../../api/apiClient.js";

/**
 * Spotter — Meal API Functions
 *
 * Wraps all /api/meals endpoints.
 * Each function unwraps the ApiResponse envelope and returns the data payload.
 */

const unwrapData = (response) => response.data.data;

/**
 * GET /api/meals
 * Returns only meals belonging to the authenticated user.
 * The `date` parameter represents the user's calendar day (YYYY-MM-DD),
 * not UTC day — the backend converts using the user's saved timezone.
 *
 * @param {{ date?: string, page?: number, limit?: number }} params
 * @returns {Promise<PaginatedResponse<Meal>>}
 */
export async function getMeals(params = {}) {
  return unwrapData(await apiClient.get("/api/meals", { params }));
}

/**
 * GET /api/meals/:mealId
 * Returns one owned meal with its complete historical snapshots.
 * A missing meal or another user's meal returns 404 MEAL_NOT_FOUND.
 *
 * @param {string} mealId
 * @returns {Promise<Meal>}
 */
export async function getMeal(mealId) {
  return unwrapData(await apiClient.get(`/api/meals/${mealId}`));
}

/**
 * POST /api/meals
 * Creates the meal and all snapshots atomically.
 * The returned object is authoritative — replace local draft/calculated totals.
 *
 * @param {SaveMealRequest} payload
 * @returns {Promise<Meal>}
 */
export async function createMeal(payload) {
  return unwrapData(await apiClient.post("/api/meals", payload));
}

/**
 * PUT /api/meals/:mealId
 * Full meal replacement. The frontend must send meal type, timestamp,
 * notes, and every remaining item — not only changed items.
 * Nutrition is recalculated from current food/recipe values.
 *
 * @param {string} mealId
 * @param {SaveMealRequest} payload
 * @returns {Promise<Meal>}
 */
export async function updateMeal(mealId, payload) {
  return unwrapData(await apiClient.put(`/api/meals/${mealId}`, payload));
}

/**
 * DELETE /api/meals/:mealId
 * No body or password is required. The meal and its snapshots are
 * permanently deleted.
 *
 * @param {string} mealId
 * @returns {Promise<void>}
 */
export async function deleteMeal(mealId) {
  await apiClient.delete(`/api/meals/${mealId}`);
}

/* ── Query Keys ──────────────────────────────────────────── */

export const MEALS_KEY = ["meals"];

export function mealDetailKey(mealId) {
  return ["meals", mealId];
}
