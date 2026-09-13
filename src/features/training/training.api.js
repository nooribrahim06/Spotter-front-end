import { apiClient } from '../../api/apiClient.js';
import { normalizeApiError } from '../../api/normalizeApiError.js';

async function request(method, url, data, signal) {
  try {
    const response = await apiClient.request({ method, url: `/api${url}`, ...(method === 'get' ? { params: data } : { data }), signal });
    return response.status === 204 ? undefined : response.data.data;
  } catch (error) { throw normalizeApiError(error); }
}
export const trainingApi = {
  config: (signal) => request('get', '/exercises/config', undefined, signal),
  exercises: (filters, signal) => request('get', '/exercises', filters, signal),
  exercise: (id, signal) => request('get', `/exercises/${id}`, undefined, signal),
  active: (signal) => request('get', '/workouts/active', undefined, signal),
  history: (filters, signal) => request('get', '/workouts/history', filters, signal),
  workout: (id, signal) => request('get', `/workouts/${id}`, undefined, signal),
  start: (data) => request('post', '/workouts', data),
  edit: (id, data) => request('patch', `/workouts/${id}`, data),
  complete: (id) => request('post', `/workouts/${id}/complete`),
  cancel: (id) => request('post', `/workouts/${id}/cancel`),
  add: (id, data) => request('post', `/workouts/${id}/exercises`, data),
  update: (id, rowId, data) => request('patch', `/workouts/${id}/exercises/${rowId}`, data),
  remove: (id, rowId) => request('delete', `/workouts/${id}/exercises/${rowId}`),
};
