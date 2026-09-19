import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server.js';
import { renderWithProviders } from '../../../test/test-utils.jsx';
import { DailyOverviewContent } from '../components/DailyOverview.jsx';
import HomePage from '../../../pages/app/HomePage.jsx';
import { useAuthStore } from '../../../stores/authStore.js';
const summary = (nutrition = {}) => ({ date: '2026-09-13', nutrition: { targetCalories: 2000, consumedCalories: 860, burnedCalories: 0, remainingCalories: 1140, burnedCaloriesComplete: true, macrosComplete: true, protein: { consumed: 72, target: 130 }, carbohydrates: { consumed: 93, target: 210 }, fat: { consumed: 38, target: 65 }, ...nutrition }, activity: { mealsLogged: 3, workoutsLogged: 0, workoutCompleted: false }, targetContext: null });
describe('daily overview', () => {
  it('displays the server result, including a negative remaining value', () => {
    renderWithProviders(<DailyOverviewContent data={summary({ remainingCalories: -240 })} />);
    expect(screen.getByText('240')).toBeInTheDocument(); expect(screen.getByText('kcal over target')).toBeInTheDocument();
    expect(screen.queryByText('1140')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view meals/i })).toHaveAttribute('href', '/app/meals?date=2026-09-13');
  });
  it('distinguishes unavailable burn from a genuine zero', () => {
    const { rerender } = renderWithProviders(<DailyOverviewContent data={summary()} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    rerender(<DailyOverviewContent data={summary({ burnedCalories: null, remainingCalories: null, burnedCaloriesComplete: false })} />);
    expect(screen.getByText('Burned calories unavailable')).toBeInTheDocument();
    expect(screen.getByText('Calories remaining unavailable')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
  it('explains missing macros without inventing zeros or progress bars', () => {
    renderWithProviders(<DailyOverviewContent data={summary({ macrosComplete: false, protein: { consumed: null, target: null }, carbohydrates: { consumed: null, target: 210 }, fat: { consumed: null, target: 65 } })} />);
    expect(screen.getByText('Macro totals incomplete.')).toBeInTheDocument();
    const macros = screen.getByRole('region', { name: 'Make room for balance.' });
    expect(within(macros).queryAllByRole('progressbar')).toHaveLength(0);
    expect(within(macros).queryByText('0')).not.toBeInTheDocument();
  });
  it('preserves target disclaimer without exposing calculator internals', () => {
    const data = summary(); data.targetContext = { calculatorVersion: 'secret-internal-v2', basedOn: { goalType: 'BUILD_MUSCLE', weightKg: 78, weightRecordedAt: '2026-09-01T10:00:00Z', targetWeightKg: null, targetDate: null }, disclaimer: 'Estimates are a starting point.' };
    renderWithProviders(<DailyOverviewContent data={data} />);
    expect(screen.getByText('Estimates are a starting point.')).toBeInTheDocument(); expect(screen.queryByText(/secret-internal/)).not.toBeInTheDocument();
  });
  it('navigates calendar days and requests server summaries for the selected date', async () => {
    const dates = [];
    server.use(http.get('*/api/daily-summary', ({ request }) => { dates.push(new URL(request.url).searchParams.get('date')); return HttpResponse.json({ data: summary() }); }));
    renderWithProviders(<HomePage />, { initialEntries: ['/app/home?date=2026-09-13'] });
    await screen.findByText('kcal remaining');
    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    await screen.findByDisplayValue('2026-09-12');
    expect(dates).toContain('2026-09-12');
  });
  it('shows a timezone action for the specific conflict response', async () => {
    useAuthStore.setState({ user: { timezone: null } });
    server.use(http.get('*/api/daily-summary', () => HttpResponse.json({ code: 'DAILY_SUMMARY_TIMEZONE_REQUIRED', details: { timezone: null } }, { status: 409 })));
    renderWithProviders(<HomePage />);
    expect(await screen.findByRole('link', { name: /set timezone/i })).toHaveAttribute('href', '/app/profile');
  });
});
