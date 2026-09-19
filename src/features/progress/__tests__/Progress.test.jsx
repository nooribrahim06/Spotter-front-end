import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server.js';
import { renderWithProviders } from '../../../test/test-utils.jsx';
import ProgressPage from '../components/ProgressPage.jsx';
import CheckInDialog from '../components/CheckInDialog.jsx';
import { createProgressEntry } from '../progress.api.js';
import { useProgressChart } from '../useProgress.js';
const entry = { id: 'e1', recordedAt: '2026-09-13T08:30:00Z', weightKg: 78, bodyFatPercentage: null, skeletalMuscleMassKg: null, restingHeartRateBpm: null, notes: null, measurements: [] };
const goal = { goal: { goalType: 'LOSE_WEIGHT', targetWeightKg: 75, targetDate: null }, starting: { weightKg: 80 }, current: { weightKg: 78 }, weightChangeKg: -2, remainingKg: 3, progressPercentage: 40 };
const history = items => ({ items, pagination: { page: 1, totalPages: 1, totalItems: items.length, hasPreviousPage: false, hasNextPage: false } });
beforeEach(() => server.use(
  http.get('*/api/progress/latest', () => HttpResponse.json({ data: entry })),
  http.get('*/api/progress/goal-progress', () => HttpResponse.json({ data: goal })),
  http.get('*/api/progress', () => HttpResponse.json({ data: history([entry]) })),
  http.get('*/api/progress/e1', () => HttpResponse.json({ data: entry }))
));
describe('progress experience', () => {
  it('shows an intentional first-entry state and specific no-goal action', async () => {
    server.use(http.get('*/api/progress/latest', () => HttpResponse.json({ data: null })), http.get('*/api/progress/goal-progress', () => HttpResponse.json({ code: 'ACTIVE_GOAL_REQUIRED' }, { status: 409 })));
    renderWithProviders(<ProgressPage />);
    expect(await screen.findByRole('button', { name: 'Log my first check-in' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /set a goal/i })).toHaveAttribute('href', '/app/goals');
    expect(screen.queryByRole('img', { name: /over time/i })).not.toBeInTheDocument();
  });
  it('does not manufacture percentages for goals without weight targets', async () => {
    server.use(http.get('*/api/progress/goal-progress', () => HttpResponse.json({ data: { ...goal, goal: { ...goal.goal, goalType: 'IMPROVE_FITNESS', targetWeightKg: null }, progressPercentage: null, remainingKg: null } })));
    renderWithProviders(<ProgressPage />);
    expect(await screen.findByText('This goal is bigger than a weight percentage.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: /target weight/i })).not.toBeInTheDocument();
  });
  it('uses the detail endpoint with no edit/delete actions', async () => {
    let fetched = false;
    server.use(http.get('*/api/progress/e1', () => { fetched = true; return HttpResponse.json({ data: { ...entry, notes: 'Morning check-in' } }); }));
    renderWithProviders(<ProgressPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open check-in ↗' }));
    expect(await screen.findByText('Morning check-in')).toBeInTheDocument(); expect(fetched).toBe(true);
    expect(screen.queryByRole('button', { name: /^edit|^delete/i })).not.toBeInTheDocument();
  });
  it('logs weight alone, shows success, and invalidates cached summaries', async () => {
    let payload;
    server.use(http.post('*/api/progress', async ({ request }) => { payload = await request.json(); return HttpResponse.json({ data: entry }, { status: 201 }); }));
    const { queryClient } = renderWithProviders(<CheckInDialog onClose={() => {}} />);
    queryClient.setQueryDefaults(['daily-summary'], { gcTime: Infinity });
    queryClient.setQueryData(['daily-summary', '2026-09-13'], { cached: true });
    await userEvent.type(screen.getByLabelText('Weight (kg)'), '78');
    await userEvent.click(screen.getByRole('button', { name: 'Log check-in' }));
    expect(await screen.findByText('Check-in logged.')).toBeInTheDocument();
    expect(payload).toEqual({ weightKg: 78 }); expect(queryClient.getQueryState(['daily-summary', '2026-09-13']).isInvalidated).toBe(true);
  });
  it('retains the draft after a server date conflict', async () => {
    server.use(http.post('*/api/progress', () => HttpResponse.json({ code: 'INVALID_PROGRESS_DATE' }, { status: 400 })));
    renderWithProviders(<CheckInDialog onClose={() => {}} />);
    await userEvent.type(screen.getByLabelText('Weight (kg)'), '78'); await userEvent.click(screen.getByRole('button', { name: 'Log check-in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('overlaps your saved timeline'); expect(screen.getByLabelText('Weight (kg)')).toHaveValue(78);
  });
  it('strips forbidden association fields at the API boundary', async () => {
    let sent;
    server.use(http.post('*/api/progress', async ({ request }) => { sent = await request.json(); return HttpResponse.json({ data: entry }); }));
    await createProgressEntry({ weightKg: 78, userId: 'x', goalId: 'y', bodyProfileId: 'z', isInitialForGoal: true });
    expect(sent).toEqual({ weightKg: 78 });
  });
  it('fetches every chart page, including entries beyond the API page limit', async () => {
    const requested = [];
    server.use(http.get('*/api/progress', ({ request }) => { const page = Number(new URL(request.url).searchParams.get('page')); requested.push(page); return HttpResponse.json({ data: { ...history([{ ...entry, id: `e${page}` }]), pagination: { hasNextPage: page < 2 } } }); }));
    function Probe() { const query = useProgressChart({}); return <p>{query.data?.map(e => e.id).join(',')}</p>; }
    renderWithProviders(<Probe />);
    await waitFor(() => expect(screen.getByText('e1,e2')).toBeInTheDocument()); expect(requested).toEqual([1, 2]);
  });
});
