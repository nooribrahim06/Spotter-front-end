import { apiClient } from '../../api/apiClient.js';
export const DAILY_SUMMARY_KEY = ['daily-summary'];
export const dailySummaryKey = date => [...DAILY_SUMMARY_KEY, date];
/** @returns {Promise<import('./daily-summary.types').DailySummary>} */
export async function getDailySummary(date, signal) { return (await apiClient.get('/api/daily-summary', { params: { date }, signal })).data.data; }
