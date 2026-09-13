import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecipeOverview,
  searchRecipes,
  getRecipeDetails,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  RECIPES_OVERVIEW_KEY,
  RECIPES_SEARCH_KEY,
  recipeDetailKey,
} from "../api/recipes.api.js";

/**
 * Hook to fetch overview recipes (10 recent + 20 custom)
 */
export function useRecipeOverview() {
  return useQuery({
    queryKey: RECIPES_OVERVIEW_KEY,
    queryFn: () => getRecipeOverview(),
  });
}

/**
 * Hook to search recipes.
 * Active when a search term, cuisine, or countryCode filter is present.
 */
export function useRecipeSearch(params = {}) {
  const hasQuery = Boolean(
    params.search?.trim() || params.cuisine?.trim() || params.countryCode?.trim()
  );

  return useQuery({
    queryKey: [...RECIPES_SEARCH_KEY, params],
    queryFn: () => searchRecipes(params),
    enabled: hasQuery,
  });
}

/**
 * Hook to fetch full recipe details (ingredients, instructions, nutrition)
 */
export function useRecipeDetails(recipeId) {
  return useQuery({
    queryKey: recipeDetailKey(recipeId),
    queryFn: () => getRecipeDetails(recipeId),
    enabled: Boolean(recipeId),
  });
}

/**
 * Hook to create a recipe.
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createRecipe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_OVERVIEW_KEY });
    },
  });
}

/**
 * Hook to update a recipe.
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, payload }) => updateRecipe(recipeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: RECIPES_OVERVIEW_KEY });
      queryClient.invalidateQueries({
        queryKey: recipeDetailKey(variables.recipeId),
      });
    },
  });
}

/**
 * Hook to delete a recipe (requires password).
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, password }) => deleteRecipe(recipeId, { password }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: RECIPES_OVERVIEW_KEY });
      queryClient.invalidateQueries({
        queryKey: recipeDetailKey(variables.recipeId),
      });
    },
  });
}
