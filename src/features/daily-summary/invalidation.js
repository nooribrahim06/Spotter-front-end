import { DAILY_SUMMARY_KEY, dailySummaryKey } from './daily-summary.api.js';
import { calendarDate } from './daily-summary.domain.js';
import { useAuthStore } from '../../stores/authStore.js';
// Include both old and new dates when an activity moves. If a deleted activity
// isn't cached, invalidate broadly rather than leave a potentially stale day.
export function invalidateActivityDays(client, ...timestamps) {
  const timezone = useAuthStore.getState().user?.timezone;
  const dates = timestamps.map(value => value && calendarDate(value, timezone));
  if (!dates.length || dates.some(value => !value)) return client.invalidateQueries({ queryKey: DAILY_SUMMARY_KEY });
  return Promise.all([...new Set(dates)].map(date => client.invalidateQueries({ queryKey: dailySummaryKey(date) })));
}
export function invalidateJourney(client) {
  return Promise.all([['progress'], ['daily-summary'], ['profile', 'me'], ['profile', 'targets'], ['goals']].map(queryKey => client.invalidateQueries({ queryKey })));
}
export function cachedActivityTime(client, root, id, field) {
  for (const [, data] of client.getQueriesData({ queryKey: [root] })) {
    if (data?.id === id) return data[field];
    const item = data?.items?.find(item => item.id === id);
    if (item) return item[field];
  }
  return undefined;
}
