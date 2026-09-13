import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFoodOverview,
  searchFoods,
  createCustomFood,
  FOODS_OVERVIEW_KEY,
  FOODS_SEARCH_KEY,
} from "../api/foods.api.js";

/**
 * Hook to fetch overview foods (10 recent + 20 custom)
 */
export function useFoodOverview() {
  return useQuery({
    queryKey: FOODS_OVERVIEW_KEY,
    queryFn: () => getFoodOverview(),
  });
}

/**
 * Hook to search foods.
 * Active when a search term or category filter is present.
 */
export function useFoodSearch(params = {}) {
  const hasQuery = Boolean(params.search?.trim() || params.category?.trim());

  return useQuery({
    queryKey: [...FOODS_SEARCH_KEY, params],
    queryFn: () => searchFoods(params),
    enabled: hasQuery,
  });
}

/**
 * Hook to create a custom food.
 * On success, invalidates the overview foods query.
 */
export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createCustomFood(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOODS_OVERVIEW_KEY });
    },
  });
}
