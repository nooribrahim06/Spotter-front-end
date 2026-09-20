import { apiClient } from '../../api/apiClient.js';
import { normalizeApiError } from '../../api/normalizeApiError.js';

async function request(method, url, data, signal) {
  try {
    const response = await apiClient.request({
      method,
      url: `/api${url}`,
      ...(method === 'get' ? { params: data } : { data }),
      signal,
    });
    return response.status === 204 ? undefined : response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function requestWithStatus(method, url, data) {
  try {
    const response = await apiClient.request({
      method,
      url: `/api${url}`,
      data,
    });
    return { status: response.status, data: response.status === 204 ? undefined : response.data.data };
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const plansApi = {
  /** GET /api/plans/context — readiness check */
  context: (signal) => request('get', '/plans/context', undefined, signal),

  /** POST /api/plans/generate — start AI plan generation; returns { status, data } */
  generate: (data) => requestWithStatus('post', '/plans/generate', data),

  /** GET /api/plans — paginated plan list */
  list: (filters, signal) => request('get', '/plans', filters, signal),

  /** GET /api/plans/active — current active plan; null when none */
  active: async (signal) => {
    try {
      return await request('get', '/plans/active', undefined, signal);
    } catch (error) {
      if (error.status === 404 || error.code === 'PLAN_NOT_FOUND') return null;
      throw error;
    }
  },

  /** GET /api/plans/schedule?date=YYYY-MM-DD — schedule for a calendar date */
  schedule: async (date, signal) => {
    try {
      return await request('get', '/plans/schedule', { date }, signal);
    } catch (error) {
      if (error.status === 404 || error.code === 'PLAN_NOT_FOUND') return null;
      throw error;
    }
  },

  /** GET /api/plans/:id — full plan detail */
  plan: (id, signal) => request('get', `/plans/${id}`, undefined, signal),

  /** POST /api/plans/:id/activate */
  activate: (id, data) => request('post', `/plans/${id}/activate`, data),

  /** POST /api/plans/:id/end */
  end: (id) => request('post', `/plans/${id}/end`),

  /** POST /api/plans/:id/discard */
  discard: (id) => request('post', `/plans/${id}/discard`),

  /** POST /api/workouts/from-plan — returns { status: 200|201, data: workout } */
  startFromPlan: (data) => requestWithStatus('post', '/workouts/from-plan', data),

  /** POST /api/meals/from-plan */
  logMealFromPlan: (data) => request('post', '/meals/from-plan', data),
};
