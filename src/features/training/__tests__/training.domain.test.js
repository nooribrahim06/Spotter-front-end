import { describe, expect, it } from 'vitest';
import { workoutName, parseTracking, trackingValues, trackingSummary, dateRange, fieldErrors, errorMessage } from '../training.domain.js';

describe('training contract rules', () => {
  it.each([[4, 'Night'], [5, 'Morning'], [11, 'Morning'], [12, 'Afternoon'], [16, 'Afternoon'], [17, 'Evening'], [20, 'Evening'], [21, 'Night']])('derives display names in local time at hour %s', (hour, label) => {
    expect(workoutName({ name: null, startedAt: new Date(2026, 8, 12, hour).toISOString() })).toBe(`${label} workout`);
  });
  it('preserves authored names', () => expect(workoutName({ name: 'My session' })).toBe('My session'));
  it.each([{ setsCount: 3, repsPerSet: 10, weightKg: 0 }, { repsPerSet: 10 }, { repsPerSet: 10, weightKg: 40 }, { durationSeconds: 60 }, { distanceMeters: 1.5 }, { durationSeconds: 1800, distanceMeters: 5000 }, { setsCount: 3, repsPerSet: 10, weightKg: 40, durationSeconds: 60, distanceMeters: 10 }])('allows supported combinations %o', values => expect(parseTracking(values).errors).toEqual({}));
  it.each([{}, { setsCount: 3 }, { weightKg: 0 }, { setsCount: 3, repsPerSet: 10.5 }, { durationSeconds: 0 }, { durationSeconds: 1.5 }, { durationSeconds: 86401 }, { distanceMeters: 0 }, { distanceMeters: 1000001 }, { setsCount: Infinity, repsPerSet: 2 }, { setsCount: 101, repsPerSet: 2 }, { setsCount: 3, repsPerSet: 1001 }, { setsCount: 3, repsPerSet: 10, weightKg: 1501 }])('rejects incomplete or invalid tracking %o', values => expect(Object.keys(parseTracking(values).errors).length).toBeGreaterThan(0));
  it('patches only changed fields and clears strength as a group', () => {
    const row = { setsCount: 3, repsPerSet: 10, weightKg: 40, durationSeconds: 60, distanceMeters: null, notes: null };
    expect(parseTracking({ ...trackingValues(row), weightKg: '45' }, row).data).toEqual({ weightKg: 45 });
    expect(parseTracking({ ...trackingValues(row), setsCount: '', repsPerSet: '', weightKg: '' }, row).data).toEqual({ setsCount: null, repsPerSet: null, weightKg: null });
    expect(parseTracking(trackingValues(row), row).data).toEqual({});
  });
  it('never turns null values into zero', () => expect(trackingSummary({ setsCount: null, weightKg: null, durationSeconds: null, distanceMeters: null })).toEqual([]));
  it('includes zero bodyweight and formats seconds accurately', () => expect(trackingSummary({ setsCount: 3, repsPerSet: 10, weightKg: 0, durationSeconds: 90 })).toEqual(['3 × 10 reps', '0 kg', '1 min 30 sec']));
  it('covers full local dates and rejects reversed ranges', () => {
    const result = dateRange('2026-09-12', '2026-09-12').params;
    expect(new Date(result.from).getHours()).toBe(0);
    expect(new Date(result.to).getHours()).toBe(23);
    expect(new Date(result.to).getMilliseconds()).toBe(999);
    expect(dateRange('2026-09-13', '2026-09-12').error).toBeTruthy();
  });
  it('maps stable error codes and hides internal server messages', () => {
    expect(fieldErrors({ code: 'INVALID_WORKOUT_EXERCISE', details: [{ field: 'weightKg', message: 'Weight needs reps' }] }, ['weightKg'])).toEqual({ weightKg: 'Weight needs reps' });
    expect(errorMessage({ code: 'INTERNAL_SERVER_ERROR', message: 'secret database detail' })).not.toContain('secret');
  });
});
