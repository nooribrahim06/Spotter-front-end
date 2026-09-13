import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  MEALS_KEY,
  mealDetailKey,
} from "../api/meals.api.js";
import { FOODS_OVERVIEW_KEY } from "../api/foods.api.js";
import { RECIPES_OVERVIEW_KEY } from "../api/recipes.api.js";

/**
 * Spotter — Meal React Query Hooks
 *
 * Wraps meal API functions with TanStack Query.
 * Mutations invalidate related query keys to keep the UI in sync.
 */

/**
 * Fetch meals for a specific date.
 * The date parameter is a YYYY-MM-DD string in the user's local timezone.
 *
 * @param {string} [date] - YYYY-MM-DD, omit for all meals
 * @param {{ page?: number, limit?: number }} [options]
 */
export function useMealsByDate(date, options = {}) {
  return useQuery({
    queryKey: [...MEALS_KEY, { date, ...options }],
    queryFn: async () => {
      let page = 1;
      let allItems = [];
      let totalPages = 1;

      do {
        const response = await getMeals({ date, page, limit: 50, ...options });
        allItems = allItems.concat(response.items);
        totalPages = response.meta?.totalPages || 1;
        page++;
      } while (page <= totalPages);

      return { items: allItems };
    },
  });
}

/**
 * Fetch a single meal by ID.
 * Enabled only when mealId is truthy.
 *
 * @param {string|null} mealId
 */
export function useMealDetail(mealId) {
  return useQuery({
    queryKey: mealDetailKey(mealId),
    queryFn: () => getMeal(mealId),
    enabled: !!mealId,
  });
}

/**
 * Create a new meal.
 * On success, invalidates the meals list and food/recipe overviews
 * (since the logged items affect "recently logged" lists).
 */
export function useCreateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createMeal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEALS_KEY });
      queryClient.invalidateQueries({ queryKey: FOODS_OVERVIEW_KEY });
      queryClient.invalidateQueries({ queryKey: RECIPES_OVERVIEW_KEY });
    },
  });
}

/**
 * Update an existing meal (full replacement).
 * On success, invalidates both the meals list and the specific meal detail.
 */
export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mealId, payload }) => updateMeal(mealId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MEALS_KEY });
      queryClient.invalidateQueries({
        queryKey: mealDetailKey(variables.mealId),
      });
      queryClient.invalidateQueries({ queryKey: FOODS_OVERVIEW_KEY });
      queryClient.invalidateQueries({ queryKey: RECIPES_OVERVIEW_KEY });
    },
  });
}

/**
 * Delete a meal. No password required.
 * On success, invalidates the meals list.
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mealId) => deleteMeal(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEALS_KEY });
    },
  });
}
