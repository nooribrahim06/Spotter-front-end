import { apiClient } from "../../../api/apiClient.js";

/**
 * Spotter — Recipe API Functions
 *
 * Wraps all /api/recipes endpoints.
 * Each function unwraps the ApiResponse envelope and returns the data payload.
 */

const unwrapData = (response) => response.data.data;

/**
 * GET /api/recipes
 * Returns the user's 10 most recently logged recipes and 20 most recently
 * updated custom recipes. Used when opening the recipe picker.
 *
 * @returns {Promise<{ recentRecipes: RecipeSummary[], customRecipes: RecipeSummary[] }>}
 */
export async function getRecipeOverview() {
  return unwrapData(await apiClient.get("/api/recipes"));
}

/**
 * GET /api/recipes/search
 * Searches active global recipes plus the user's own recipes.
 *
 * @param {{ search?: string, cuisine?: string, countryCode?: string, page?: number, limit?: number }} params
 * @returns {Promise<PaginatedResponse<RecipeSummary>>}
 */
export async function searchRecipes(params = {}) {
  return unwrapData(await apiClient.get("/api/recipes/search", { params }));
}

/**
 * GET /api/recipes/:recipeId
 * Returns the recipe with calculated nutrition, instructions, and ingredients.
 * A private recipe belonging to another user returns 404 RECIPE_NOT_FOUND.
 *
 * @param {string} recipeId
 * @returns {Promise<RecipeDetails>}
 */
export async function getRecipeDetails(recipeId) {
  return unwrapData(await apiClient.get(`/api/recipes/${recipeId}`));
}

/**
 * POST /api/recipes
 * Creates a recipe owned by the authenticated user.
 * The frontend must not send calculated nutrition — the backend calculates it.
 *
 * @param {CreateRecipeRequest} payload
 * @returns {Promise<RecipeDetails>}
 */
export async function createRecipe(payload) {
  return unwrapData(await apiClient.post("/api/recipes", payload));
}

/**
 * PUT /api/recipes/:recipeId
 * Full recipe replacement. Only available when recipe.canEdit === true.
 * The request body is the same as POST — send the complete recipe.
 *
 * @param {string} recipeId
 * @param {CreateRecipeRequest} payload
 * @returns {Promise<RecipeDetails>}
 */
export async function updateRecipe(recipeId, payload) {
  return unwrapData(await apiClient.put(`/api/recipes/${recipeId}`, payload));
}

/**
 * DELETE /api/recipes/:recipeId
 * Requires the user's current account password for confirmation.
 * Deletion archives the recipe; existing meal snapshots remain unchanged.
 *
 * @param {string} recipeId
 * @param {{ password: string }} body
 * @returns {Promise<void>}
 */
export async function deleteRecipe(recipeId, { password }) {
  await apiClient.delete(`/api/recipes/${recipeId}`, {
    data: { password },
  });
}

/* ── Query Keys ──────────────────────────────────────────── */

export const RECIPES_OVERVIEW_KEY = ["recipes", "overview"];
export const RECIPES_SEARCH_KEY = ["recipes", "search"];

export function recipeDetailKey(recipeId) {
  return ["recipes", recipeId];
}
