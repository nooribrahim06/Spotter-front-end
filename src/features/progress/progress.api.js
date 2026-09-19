import { apiClient } from '../../api/apiClient.js';
export const PROGRESS_KEY = ['progress'];
export const progressKeys = { history: filters => [...PROGRESS_KEY, filters], latest: [...PROGRESS_KEY, 'latest'], goal: [...PROGRESS_KEY, 'goal-progress'], entry: id => [...PROGRESS_KEY, 'entry', id], chart: filters => [...PROGRESS_KEY, 'chart', filters] };
/** @param {import('./progress.types').CreateProgressBody} payload */
export async function createProgressEntry(payload) {
  // Explicit allowlist: association fields always belong to the server.
  const { weightKg, recordedAt, bodyFatPercentage, skeletalMuscleMassKg, restingHeartRateBpm, notes, measurements } = payload;
  return (await apiClient.post('/api/progress', { weightKg, recordedAt, bodyFatPercentage, skeletalMuscleMassKg, restingHeartRateBpm, notes, measurements: measurements?.map(({ measurementType, valueCm }) => ({ measurementType, valueCm })) })).data.data;
}
/** @param {import('./progress.types').ProgressFilters} filters */
export async function getProgressHistory(filters = {}, signal) { return (await apiClient.get('/api/progress', { params: filters, signal })).data.data; }
export async function getLatestProgress(signal) { return (await apiClient.get('/api/progress/latest', { signal })).data.data; }
export async function getProgressEntry(id, signal) { return (await apiClient.get(`/api/progress/${encodeURIComponent(id)}`, { signal })).data.data; }
export async function getGoalProgress(signal) { return (await apiClient.get('/api/progress/goal-progress', { signal })).data.data; }
