import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProgressEntry, getProgressHistory, getLatestProgress, getProgressEntry, getGoalProgress, progressKeys } from './progress.api.js';
import { invalidateJourney } from '../daily-summary/invalidation.js';
export const useLatestProgress = () => useQuery({ queryKey: progressKeys.latest, queryFn: ({ signal }) => getLatestProgress(signal), retry: false });
export const useGoalProgress = () => useQuery({ queryKey: progressKeys.goal, queryFn: ({ signal }) => getGoalProgress(signal), retry: false });
export const useProgressHistory = filters => useQuery({ queryKey: progressKeys.history(filters), queryFn: ({ signal }) => getProgressHistory(filters, signal), retry: false });
export const useProgressEntry = id => useQuery({ queryKey: progressKeys.entry(id), queryFn: ({ signal }) => getProgressEntry(id, signal), enabled: !!id, retry: false });
export function useProgressChart(filters, enabled = true) {
  return useQuery({ queryKey: progressKeys.chart(filters), enabled, retry: false, queryFn: async ({ signal }) => {
    let page = 1, response; const items = [];
    do { response = await getProgressHistory({ ...filters, page, limit: 100 }, signal); items.push(...response.items); page++; } while (response.pagination.hasNextPage);
    return items;
  } });
}
export function useCreateProgress() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createProgressEntry, retry: false, onSuccess: () => invalidateJourney(client) });
}
