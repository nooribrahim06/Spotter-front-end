import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../test/mocks/server.js';
import { renderWithProviders } from '../../../test/test-utils.jsx';
import { useAuthStore } from '../../../stores/authStore.js';
import TrainingHome from '../components/TrainingHome.jsx';
import WorkoutSession from '../components/WorkoutSession.jsx';
import TrainingHistory from '../components/TrainingHistory.jsx';
import ExerciseMedia from '../components/ExerciseMedia.jsx';
import { trainingApi } from '../training.api.js';

const exercise = { id: '11111111-1111-4111-8111-111111111111', slug: 'bench-press', name: 'Bench Press', exerciseType: 'STRENGTH', bodyPart: 'CHEST', difficulty: 'BEGINNER', equipment: 'BARBELL', force: 'PUSH', mechanic: 'COMPOUND', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], instructions: ['Supplied instruction.'], trackingMetrics: ['SETS', 'REPS', 'WEIGHT'], media: { previewUrl: null, animationUrl: null } };
const base = { id: '22222222-2222-4222-8222-222222222222', name: null, status: 'IN_PROGRESS', startedAt: '2026-09-12T15:30:00Z', completedAt: null, durationMinutes: null, estimatedCaloriesBurned: null, notes: null, exercises: [], createdAt: '2026-09-12T15:30:00Z', updatedAt: '2026-09-12T15:30:00Z' };
const movement = { id: '33333333-3333-4333-8333-333333333333', exerciseOrder: 0, setsCount: 3, repsPerSet: 10, weightKg: 40, durationSeconds: null, distanceMeters: null, notes: null, completed: false, exercise };
const pageData = items => ({ items, pagination: { page: 1, limit: 12, totalItems: items.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false } });
let workout, calls;
function renderTraining(url = '/app/training') {
  return renderWithProviders(<Routes><Route path="/app/training" element={<TrainingHome />} /><Route path="/app/training/history" element={<TrainingHistory />} /><Route path="/app/training/workouts/:workoutId" element={<WorkoutSession />} /></Routes>, { initialEntries: [url] });
}
beforeEach(() => {
  workout = null; calls = [];
  useAuthStore.setState({ user: { id: 'test-user' }, authStatus: 'authenticated', accessToken: 'test-token' });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  server.use(
    http.get('*/api/workouts/active', () => HttpResponse.json({ data: workout?.status === 'IN_PROGRESS' ? workout : null })),
    http.get('*/api/workouts/history', () => HttpResponse.json({ data: pageData(workout && workout.status !== 'IN_PROGRESS' ? [workout] : []) })),
    http.get('*/api/workouts/:id', () => workout ? HttpResponse.json({ data: workout }) : HttpResponse.json({ code: 'WORKOUT_NOT_FOUND', error: 'missing' }, { status: 404 })),
    http.get('*/api/exercises/config', () => HttpResponse.json({ data: { trackingMetrics: ['SETS', 'REPS', 'WEIGHT', 'DURATION', 'DISTANCE'], exerciseTypes: ['STRENGTH', 'CARDIO'], bodyParts: ['CHEST'], equipment: ['BARBELL'], difficulties: ['BEGINNER'], forces: ['PUSH'], mechanics: ['COMPOUND'] } })),
    http.get('*/api/exercises', ({ request }) => { calls.push(new URL(request.url).search); return HttpResponse.json({ data: pageData([exercise]) }); }),
    http.get('*/api/exercises/:id', () => HttpResponse.json({ data: exercise })),
    http.post('*/api/workouts', async ({ request }) => { const data = await request.json(); calls.push({ start: data }); workout = { ...base, ...data }; return HttpResponse.json({ data: workout }, { status: 201 }); }),
    http.post('*/api/workouts/:id/exercises', async ({ request }) => { const data = await request.json(); calls.push({ add: data }); const row = { ...movement, ...data }; delete row.exerciseId; workout = { ...workout, exercises: [row] }; return HttpResponse.json({ data: row }, { status: 201 }); }),
    http.patch('*/api/workouts/:id/exercises/:rowId', async ({ request, params }) => { const data = await request.json(); calls.push({ update: data, rowId: params.rowId }); const row = { ...workout.exercises[0], ...data }; workout = { ...workout, exercises: [row] }; return HttpResponse.json({ data: row }); }),
    http.post('*/api/workouts/:id/complete', async ({ request }) => { calls.push({ completeBody: await request.text() }); workout = { ...workout, status: 'COMPLETED', completedAt: '2026-09-12T16:17:00Z', durationMinutes: 47 }; return HttpResponse.json({ data: workout }); }),
    http.post('*/api/workouts/:id/cancel', () => { workout = { ...workout, status: 'CANCELLED' }; return HttpResponse.json({ data: workout }); }),
    http.delete('*/api/workouts/:id/exercises/:rowId', () => { workout = { ...workout, exercises: [] }; return new HttpResponse(null, { status: 204 }); }),
  );
});

describe('Training lifecycle', () => {
  it('starts unnamed, adds summary tracking, completes a row, then uses the server recap', async () => {
    const user = userEvent.setup(); renderTraining();
    await user.click(await screen.findByRole('button', { name: 'Start workout' }, { timeout: 5000 }));
    await user.click(screen.getByRole('button', { name: 'Start training' }));
    await user.click(await screen.findByRole('button', { name: 'Add exercise' }));
    await user.click(await screen.findByRole('button', { name: 'Add Bench Press' }, { timeout: 5000 }));
    await user.type(screen.getByLabelText('Sets'), '3');
    await user.type(screen.getByLabelText('Reps per set'), '10');
    await user.type(screen.getByLabelText('Weight · kg'), '40');
    await user.click(screen.getByRole('button', { name: 'Add to workout' }));
    await user.click(await screen.findByRole('button', { name: 'Complete', exact: true }));
    await waitFor(() => expect(workout.exercises[0].completed).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Finish workout' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Finish workout' }));
    expect(await screen.findByRole('heading', { name: 'You showed up. It counts.' })).toBeInTheDocument();
    expect(screen.getByText('47 minutes · 1 movement completed')).toBeInTheDocument();
    expect(calls).toContainEqual({ start: {} });
    expect(calls).toContainEqual({ add: { exerciseId: exercise.id, setsCount: 3, repsPerSet: 10, weightKg: 40 } });
    expect(calls).toContainEqual({ update: { completed: true }, rowId: movement.id });
    expect(calls).toContainEqual({ completeBody: '' });
    await user.click(screen.getByRole('button', { name: 'See what you did' }));
    expect(screen.queryByRole('button', { name: 'Add exercise' })).not.toBeInTheDocument();
    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument();
  }, 15000);
  it('restores an existing session and only offers Continue workout', async () => {
    workout = { ...base, exercises: [movement] }; renderTraining();
    expect(await screen.findByRole('link', { name: 'Continue workout' })).toHaveAttribute('href', `/app/training/workouts/${base.id}`);
    expect(screen.queryByRole('button', { name: 'Start workout' })).not.toBeInTheDocument();
  });
  it('opens the existing workout after an active-session conflict', async () => {
    server.use(http.post('*/api/workouts', () => { workout = { ...base }; return HttpResponse.json({ code: 'ACTIVE_WORKOUT_EXISTS', error: 'conflict' }, { status: 409 }); }));
    const user = userEvent.setup(); renderTraining();
    await user.click(await screen.findByRole('button', { name: 'Start workout' }, { timeout: 5000 }));
    await user.click(screen.getByRole('button', { name: 'Start training' }));
    expect(await screen.findByRole('button', { name: 'Add exercise' })).toBeInTheDocument();
  });
  it('blocks finishing when no movement is completed', async () => {
    workout = { ...base, exercises: [movement] }; const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Finish workout' }));
    expect(screen.getByRole('heading', { name: 'One movement first.' })).toBeInTheDocument();
    expect(calls.some(call => 'completeBody' in Object(call))).toBe(false);
  });
  it('preserves typed tracking on a server error and sends only the changed field', async () => {
    workout = { ...base, exercises: [movement] };
    server.use(http.patch('*/api/workouts/:id/exercises/:rowId', async ({ request }) => { calls.push(await request.json()); return HttpResponse.json({ code: 'INVALID_WORKOUT_EXERCISE', error: 'invalid', details: [{ field: 'weightKg', message: 'Check this weight.' }] }, { status: 409 }); }));
    const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Edit Bench Press' }));
    await user.clear(screen.getByLabelText('Weight · kg')); await user.type(screen.getByLabelText('Weight · kg'), '45');
    await user.click(screen.getByRole('button', { name: 'Save movement' }));
    expect(await screen.findByText('Check this weight.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Weight · kg/)).toHaveValue(45);
    expect(calls).toContainEqual({ weightKg: 45 });
  });
  it('keeps duplicate picker search state and disables already-added movements', async () => {
    workout = { ...base, exercises: [] };
    server.use(http.post('*/api/workouts/:id/exercises', () => { workout = { ...workout, exercises: [movement] }; return HttpResponse.json({ code: 'DUPLICATE_WORKOUT_EXERCISE', error: 'duplicate' }, { status: 409 }); }));
    const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Add exercise' }));
    await user.type(await screen.findByLabelText('Search movements'), 'bench');
    await user.click(await screen.findByRole('button', { name: 'Add Bench Press' }, { timeout: 5000 }));
    await user.type(screen.getByLabelText('Sets'), '3'); await user.type(screen.getByLabelText('Reps per set'), '10');
    await user.click(screen.getByRole('button', { name: 'Add to workout' }));
    expect(await screen.findByText(/already in your workout/)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Back', exact: true })[0]);
    expect(screen.getByLabelText('Search movements')).toHaveValue('bench');
    expect(await screen.findByRole('button', { name: 'Bench Press already added' })).toBeDisabled();
  });
  it('disables all mutations when a stale session has ended', async () => {
    workout = { ...base, exercises: [movement] };
    server.use(http.patch('*/api/workouts/:id/exercises/:rowId', () => { workout = { ...workout, status: 'CANCELLED' }; return HttpResponse.json({ code: 'INVALID_WORKOUT_STATE', error: 'ended' }, { status: 409 }); }));
    const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Complete', exact: true }));
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finish workout' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Bench Press' })).not.toBeInTheDocument();
  });
  it('requires cancellation confirmation and shows no invented statistics', async () => {
    workout = { ...base, exercises: [movement] }; const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Cancel workout' }));
    expect(workout.status).toBe('IN_PROGRESS');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel workout' }));
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByText(/^0 min|0 kcal$/)).not.toBeInTheDocument();
  });
  it('handles deletion as 204 and refreshes the movement list', async () => {
    workout = { ...base, exercises: [movement] }; const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Remove Bench Press' }));
    await user.click(screen.getByRole('button', { name: 'Remove movement' }));
    expect(await screen.findByRole('heading', { name: 'Find your rhythm.' })).toBeInTheDocument();
  });
  it('does not retry rate limits automatically', async () => {
    let count = 0;
    server.use(http.get('*/api/workouts/active', () => { count++; return HttpResponse.json({ code: 'TOO_MANY_REQUESTS', error: 'slow down' }, { status: 429 }); }));
    renderTraining();
    expect(await screen.findByText(/A little breather/)).toBeInTheDocument();
    expect(count).toBe(1);
  });
  it('uses pagination metadata and config filters', async () => {
    server.use(http.get('*/api/exercises', ({ request }) => { const url = new URL(request.url); calls.push(url.search); return HttpResponse.json({ data: { items: [exercise], pagination: { page: Number(url.searchParams.get('page')), totalPages: 2, totalItems: 13, hasNextPage: url.searchParams.get('page') === '1', hasPreviousPage: url.searchParams.get('page') === '2' } } }); }));
    const user = userEvent.setup(); renderTraining();
    await user.click(await screen.findByRole('button', { name: 'Browse exercises' }));
    await user.selectOptions(await screen.findByLabelText('Body parts'), 'CHEST');
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(calls.some(call => typeof call === 'string' && call.includes('bodyPart=CHEST') && call.includes('page=2'))).toBe(true);
  });
  it('keeps animation playback explicit when preview loading fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExerciseMedia exercise={{ ...exercise, media: { previewUrl: '/preview.jpg', animationUrl: '/demo.gif' } }} detail />);
    const img = screen.getByRole('img'); expect(img).toHaveAttribute('src', '/preview.jpg');
    fireEvent.error(img);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play Bench Press demonstration' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/demo.gif');
  });
  it('accepts an empty 204 at the API boundary', async () => {
    workout = { ...base, exercises: [movement] };
    await expect(trainingApi.remove(base.id, movement.id)).resolves.toBeUndefined();
  });
  it('converts entered minutes and kilometers to canonical API units', async () => {
    workout = { ...base, exercises: [] };
    const running = { ...exercise, exerciseType: 'CARDIO', name: 'Running', trackingMetrics: ['DURATION', 'DISTANCE'] };
    server.use(http.get('*/api/exercises', () => HttpResponse.json({ data: pageData([running]) })));
    const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Add exercise' }));
    await user.click(await screen.findByRole('button', { name: 'Add Running' }));
    expect(screen.queryByLabelText('Sets')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Duration · minutes'), '30');
    await user.type(screen.getByLabelText('Distance · kilometers'), '5');
    await user.click(screen.getByRole('button', { name: 'Add to workout' }));
    await waitFor(() => expect(calls).toContainEqual({ add: { exerciseId: exercise.id, durationSeconds: 1800, distanceMeters: 5000 } }));
  });
  it('disables new movements at the server limit', async () => {
    workout = { ...base, exercises: Array.from({ length: 50 }, (_, index) => ({ ...movement, id: `row-${index}`, exerciseOrder: index, exercise: { ...exercise, id: `exercise-${index}` } })) };
    renderTraining(`/app/training/workouts/${base.id}`);
    expect(await screen.findByRole('button', { name: '50-movement limit reached' })).toBeDisabled();
  });
  it('leaves a missing workout and refreshes the home', async () => {
    renderTraining(`/app/training/workouts/${base.id}`);
    expect(await screen.findByRole('button', { name: 'Start workout' }, { timeout: 5000 })).toBeInTheDocument();
  });
  it('retains the open session when the server rejects completion', async () => {
    workout = { ...base, exercises: [{ ...movement, completed: true }] };
    server.use(http.post('*/api/workouts/:id/complete', () => HttpResponse.json({ code: 'WORKOUT_COMPLETION_REQUIRED', error: 'Complete a movement' }, { status: 409 })));
    const user = userEvent.setup(); renderTraining(`/app/training/workouts/${base.id}`);
    await user.click(await screen.findByRole('button', { name: 'Finish workout' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Finish workout' }));
    expect(await screen.findByRole('heading', { name: 'One movement first.' })).toBeInTheDocument();
    expect(workout.status).toBe('IN_PROGRESS');
  });
});
