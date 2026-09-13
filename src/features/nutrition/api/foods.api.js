import { apiClient } from "../../../api/apiClient.js";

/**
 * Spotter — Food API Functions
 *
 * Wraps all /api/foods endpoints.
 * Each function unwraps the ApiResponse envelope and returns the data payload.
 */

const unwrapData = (response) => response.data.data;

/**
 * GET /api/foods
 * Returns the user's 10 most recently logged foods and 20 most recently
 * updated custom foods. Used when opening the food picker.
 *
 * @returns {Promise<{ recentFoods: Food[], customFoods: Food[] }>}
 */
export async function getFoodOverview() {
  return unwrapData(await apiClient.get("/api/foods"));
}

/**
 * GET /api/foods/search
 * Searches active global foods plus the authenticated user's custom foods.
 *
 * @param {{ search?: string, category?: string, page?: number, limit?: number }} params
 * @returns {Promise<PaginatedResponse<Food>>}
 */
export async function searchFoods(params = {}) {
  return unwrapData(await apiClient.get("/api/foods/search", { params }));
}

/**
 * POST /api/foods/custom
 * Creates a food owned by the authenticated user.
 *
 * @param {CreateCustomFoodRequest} payload
 * @returns {Promise<Food>}
 */
export async function createCustomFood(payload) {
  return unwrapData(await apiClient.post("/api/foods/custom", payload));
}

/* ── Query Keys ──────────────────────────────────────────── */

export const FOODS_OVERVIEW_KEY = ["foods", "overview"];
export const FOODS_SEARCH_KEY = ["foods", "search"];
