import { useQuery } from '@tanstack/react-query';
import { dailySummaryKey, getDailySummary } from './daily-summary.api.js';
import { useAuthStore } from '../../stores/authStore.js';
export function useDailySummary(date) {
  const timezone = useAuthStore(s => s.user?.timezone);
  return useQuery({ queryKey: [...dailySummaryKey(date), timezone], queryFn: ({ signal }) => getDailySummary(date, signal), retry: false });
}
