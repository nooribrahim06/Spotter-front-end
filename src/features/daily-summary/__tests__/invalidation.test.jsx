import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server.js';
import { renderWithProviders, createTestQueryClient } from '../../../test/test-utils.jsx';
import { useAuthStore } from '../../../stores/authStore.js';
import { useCreateMeal, useUpdateMeal, useDeleteMeal } from '../../nutrition/hooks/useMeals.js';
import { useTrainingAction } from '../../training/useTraining.js';
const oldTime = '2026-09-13T23:30:00Z', newTime = '2026-09-15T04:00:00Z';
beforeEach(() => useAuthStore.setState({ user: { id: 'test-user', timezone: 'Africa/Cairo' }, authStatus: 'authenticated' }));
function MealMutation({ type }) {
  const create = useCreateMeal(), update = useUpdateMeal(), remove = useDeleteMeal();
  const mutation = { create, update, remove }[type];
  return <><button onClick={() => mutation.mutate(type === 'create' ? { occurredAt: oldTime } : type === 'update' ? { mealId: 'meal', payload: { occurredAt: newTime } } : 'meal')}>Save</button>{mutation.isSuccess && <p>Saved</p>}</>;
}
function WorkoutMutation({ type }) {
  const mutation = useTrainingAction();
  return <><button onClick={() => mutation.mutate({ type, id: type === 'start' ? undefined : 'workout', data: {} })}>Save</button>{mutation.isSuccess && <p>Saved</p>}</>;
}
function cachedClient() {
  const client = createTestQueryClient(); client.setDefaultOptions({ queries: { retry: false, gcTime: Infinity } });
  for (const date of ['2026-09-13', '2026-09-14', '2026-09-15']) client.setQueryData(['daily-summary', date], { cached: true });
  return client;
}
const stale = (client, date) => client.getQueryState(['daily-summary', date]).isInvalidated;
describe('summary refresh integration', () => {
  it('invalidates the created meal’s saved local date, leaving unrelated days alone', async () => {
    server.use(http.post('*/api/meals', () => HttpResponse.json({ data: { id: 'meal', occurredAt: oldTime } })));
    const client = cachedClient(); renderWithProviders(<MealMutation type="create" />, { queryClient: client });
    await userEvent.click(screen.getByText('Save')); await screen.findByText('Saved');
    expect(stale(client, '2026-09-14')).toBe(true); expect(stale(client, '2026-09-13')).toBe(false);
  });
  it('invalidates both dates when a meal moves', async () => {
    server.use(http.put('*/api/meals/meal', () => HttpResponse.json({ data: { id: 'meal', occurredAt: newTime } })));
    const client = cachedClient(); client.setQueryData(['meals', 'meal'], { id: 'meal', occurredAt: oldTime });
    renderWithProviders(<MealMutation type="update" />, { queryClient: client });
    await userEvent.click(screen.getByText('Save')); await screen.findByText('Saved');
    expect(stale(client, '2026-09-14')).toBe(true); expect(stale(client, '2026-09-15')).toBe(true); expect(stale(client, '2026-09-13')).toBe(false);
  });
  it('finds the deleted meal’s timestamp in a cached list', async () => {
    server.use(http.delete('*/api/meals/meal', () => new HttpResponse(null, { status: 204 })));
    const client = cachedClient(); client.setQueryData(['meals', { date: '2026-09-14' }], { items: [{ id: 'meal', occurredAt: oldTime }] });
    renderWithProviders(<MealMutation type="remove" />, { queryClient: client });
    await userEvent.click(screen.getByText('Save')); await screen.findByText('Saved');
    expect(stale(client, '2026-09-14')).toBe(true); expect(stale(client, '2026-09-13')).toBe(false);
  });
  it.each(['start', 'edit', 'complete', 'cancel'])('refreshes the workout’s local day after %s', async type => {
    const result = { id: 'workout', startedAt: oldTime, status: type === 'cancel' ? 'CANCELLED' : type === 'complete' ? 'COMPLETED' : 'IN_PROGRESS', exercises: [] };
    server.use(http.post('*/api/workouts', () => HttpResponse.json({ data: result })), http.patch('*/api/workouts/workout', () => HttpResponse.json({ data: result })), http.post('*/api/workouts/workout/:action', () => HttpResponse.json({ data: result })));
    const client = cachedClient(); client.setQueryData(['training', 'test-user', 'workout', 'workout'], { ...result, status: 'IN_PROGRESS' });
    renderWithProviders(<WorkoutMutation type={type} />, { queryClient: client });
    await userEvent.click(screen.getByText('Save')); await screen.findByText('Saved');
    await waitFor(() => expect(stale(client, '2026-09-14')).toBe(true)); expect(stale(client, '2026-09-13')).toBe(false);
  });
});
