import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server.js';
import { renderWithProviders } from '../../../test/test-utils.jsx';
import TrackingEditor from '../components/TrackingEditor.jsx';

const metrics = ['SETS', 'REPS', 'WEIGHT', 'DURATION', 'DISTANCE'];
const exercise = { id: 'catalog-id', name: 'Movement', exerciseType: 'STRENGTH', bodyPart: 'FULL_BODY', equipment: 'BODY_WEIGHT', trackingMetrics: ['SETS', 'REPS', 'WEIGHT'] };
let action;
beforeEach(() => {
  action = { isPending: false, error: null, mutateAsync: vi.fn().mockResolvedValue({}) };
  server.use(http.get('*/api/exercises/config', () => HttpResponse.json({ data: { trackingMetrics: metrics } })));
});
const mount = (overrides = {}, row) => renderWithProviders(<TrackingEditor exercise={{ ...exercise, ...overrides }} row={row} workoutId="workout-id" action={action} onSaved={vi.fn()} onBack={vi.fn()} />);

describe('Exercise-specific tracking', () => {
  it('uses metrics rather than the exercise type and does not add extra input toggles', async () => {
    mount({ exerciseType: 'CARDIO', trackingMetrics: ['SETS', 'REPS'] });
    expect(await screen.findByLabelText('Sets')).toBeEnabled();
    expect(screen.getByLabelText('Reps per set')).toBeEnabled();
    expect(screen.queryByLabelText('Weight · kg')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Duration ·/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Track time|Track sets/ })).not.toBeInTheDocument();
  });
  it('gets available metric enum options from config', async () => {
    server.use(http.get('*/api/exercises/config', () => HttpResponse.json({ data: { trackingMetrics: ['DURATION'] } })));
    mount({ trackingMetrics: ['DURATION', 'DISTANCE'] });
    expect(await screen.findByLabelText('Duration · minutes')).toBeEnabled();
    expect(screen.queryByLabelText(/Distance ·/)).not.toBeInTheDocument();
  });
  it.each([
    ['Burpee', ['DURATION', 'REPS']],
    ['Jump Rope', ['DURATION', 'REPS']],
    ['Jumping Jack', ['DURATION', 'REPS']],
    ['Mountain Climber', ['DURATION', 'REPS']],
  ])('allows %s to track reps without sets', async (name, trackingMetrics) => {
    const user = userEvent.setup(); mount({ name, trackingMetrics });
    const repsInput = await screen.findByLabelText('Reps per set');
    expect(repsInput).toBeEnabled();
    await user.type(repsInput, '15');
    await user.type(screen.getByLabelText('Duration · minutes'), '2');
    await user.click(screen.getByRole('button', { name: 'Add to workout' }));
    expect(action.mutateAsync).toHaveBeenCalledWith({ type: 'add', id: 'workout-id', rowId: undefined, data: { exerciseId: 'catalog-id', repsPerSet: 15, durationSeconds: 120 } });
  });
  it.each([
    ['Plank', ['SETS', 'DURATION'], ['Sets']],
    ['Side Plank', ['SETS', 'DURATION'], ['Sets']],
    ['Wall Sit', ['SETS', 'DURATION'], ['Sets']],
    ["Farmer's Walk", ['SETS', 'WEIGHT', 'DURATION', 'DISTANCE'], ['Sets', 'Weight · kg']],
  ])('keeps %s valid without inventing sets or repetitions', async (name, trackingMetrics, blockedLabels) => {
    const user = userEvent.setup(); mount({ name, trackingMetrics });
    await user.type(await screen.findByLabelText('Duration · minutes'), '2');
    for (const label of blockedLabels) expect(screen.getByLabelText(label)).toBeDisabled();
    expect(screen.getByText(/tracking isn\u2019t available for this movement yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add to workout' }));
    expect(action.mutateAsync).toHaveBeenCalledWith({ type: 'add', id: 'workout-id', rowId: undefined, data: { exerciseId: 'catalog-id', durationSeconds: 120 } });
  });
  it('keeps both duration and distance available for Farmer’s Walk', async () => {
    const user = userEvent.setup(); mount({ trackingMetrics: ['SETS', 'WEIGHT', 'DURATION', 'DISTANCE'] });
    await user.type(await screen.findByLabelText('Distance · kilometers'), '0.05');
    await user.click(screen.getByRole('button', { name: 'Add to workout' }));
    expect(action.mutateAsync.mock.calls[0][0].data).toEqual({ exerciseId: 'catalog-id', distanceMeters: 50 });
  });
  it('does not clear hidden existing measurements when editing a note', async () => {
    const user = userEvent.setup(); mount({ trackingMetrics: ['DURATION'] }, { id: 'row-id', setsCount: 3, repsPerSet: 10, weightKg: 40, durationSeconds: 120, notes: 'Old note', completed: false });
    await screen.findByLabelText('Duration · minutes');
    await user.clear(screen.getByLabelText('Movement note · optional'));
    await user.type(screen.getByLabelText('Movement note · optional'), 'New note');
    await user.click(screen.getByRole('button', { name: 'Save movement' }));
    expect(action.mutateAsync.mock.calls[0][0]).toEqual({ type: 'update', id: 'workout-id', rowId: 'row-id', data: { notes: 'New note' } });
  });
  it('sends null only for intentionally cleared PATCH fields', async () => {
    const user = userEvent.setup(); mount({}, { id: 'row-id', setsCount: 3, repsPerSet: 10, weightKg: 40, notes: null, completed: false });
    await user.clear(await screen.findByLabelText('Weight · kg'));
    await user.click(screen.getByRole('button', { name: 'Save movement' }));
    expect(action.mutateAsync.mock.calls[0][0].data).toEqual({ weightKg: null });
  });
  it('still prevents sets without reps for supported strength metrics', async () => {
    const user = userEvent.setup(); mount();
    await user.type(await screen.findByLabelText('Sets'), '3');
    await user.click(screen.getByRole('button', { name: 'Add to workout' }));
    expect(screen.getByText('Sets need reps. Add reps per set or remove sets.')).toBeInTheDocument();
    expect(action.mutateAsync).not.toHaveBeenCalled();
  });
  it('does not infer tracking when metric metadata is absent', async () => {
    mount({ trackingMetrics: undefined });
    await screen.findByText(/Tracking isn’t available for this movement yet/);
    expect(screen.getByRole('button', { name: 'Add to workout' })).toBeDisabled();
    expect(screen.queryByLabelText('Sets')).not.toBeInTheDocument();
  });
  it('retains a retry action if configuration cannot load', async () => {
    server.use(http.get('*/api/exercises/config', () => HttpResponse.json({ code: 'INTERNAL_SERVER_ERROR' }, { status: 500 })));
    mount();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Add to workout' })).toBeDisabled();
  });
});
