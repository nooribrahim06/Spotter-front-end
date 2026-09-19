import { describe, expect, it, vi } from 'vitest';
import { chartPoints, checkInPayload, validateCheckIn, withBrowserOffset } from '../progress.domain.js';
import { calendarDate, shiftDate, validCalendarDate } from '../../daily-summary/daily-summary.domain.js';
import { invalidateActivityDays, invalidateJourney } from '../../daily-summary/invalidation.js';
import { useAuthStore } from '../../../stores/authStore.js';
const values = { weightKg: '78', recordedAt: '', bodyFatPercentage: '', skeletalMuscleMassKg: '', restingHeartRateBpm: '', notes: '', measurements: [] };
describe('check-in contract', () => {
  it('sends only weight when optional details are skipped', () => expect(checkInPayload(values)).toEqual({ weightKg: 78 }));
  it('validates required weight and backend metric bounds', () => {
    expect(validateCheckIn({ ...values, weightKg: '' })).toHaveProperty('weightKg');
    expect(validateCheckIn({ ...values, weightKg: '20' })).toEqual({});
    expect(validateCheckIn({ ...values, bodyFatPercentage: '1', skeletalMuscleMassKg: '151', restingHeartRateBpm: '68.5' })).toMatchObject({ bodyFatPercentage: expect.any(String), skeletalMuscleMassKg: expect.any(String), restingHeartRateBpm: expect.any(String) });
    expect(validateCheckIn({ ...values, skeletalMuscleMassKg: '79' })).toHaveProperty('skeletalMuscleMassKg');
  });
  it('rejects duplicate types, missing values, and oversized notes', () => {
    const errors = validateCheckIn({ ...values, notes: 'x'.repeat(1001), measurements: [{ measurementType: 'WAIST', valueCm: '' }, { measurementType: 'WAIST', valueCm: '90' }] });
    expect(errors).toHaveProperty('measurements'); expect(errors).toHaveProperty('notes'); expect(errors['measurements.0.valueCm']).toBeTruthy();
  });
  it('validates future dates and dates before the latest check-in', () => {
    const now = new Date('2026-09-14T12:00:00Z');
    expect(validateCheckIn({ ...values, recordedAt: '2027-01-01T09:00' }, null, now)).toHaveProperty('recordedAt');
    expect(validateCheckIn({ ...values, recordedAt: '2026-09-01T09:00' }, { recordedAt: '2026-09-13T10:00:00Z' }, now)).toHaveProperty('recordedAt');
  });
  it('includes the browser offset and preserves the local instant', () => {
    const local = '2026-09-13T08:30', iso = withBrowserOffset(local);
    expect(iso).toMatch(/^2026-09-13T08:30:00[+-]\d{2}:\d{2}$/);
    expect(new Date(iso).getTime()).toBe(new Date(local).getTime());
  });
  it('reverses a copy and leaves missing metrics and measurements null', () => {
    const entries = Object.freeze([Object.freeze({ id: 'new', bodyFatPercentage: null, measurements: [] }), Object.freeze({ id: 'old', bodyFatPercentage: 21, measurements: [{ measurementType: 'WAIST', valueCm: 85 }] })]);
    expect(chartPoints(entries, 'bodyFatPercentage').map(p => p.value)).toEqual([21, null]);
    expect(chartPoints(entries, 'WAIST').map(p => p.value)).toEqual([85, null]);
    expect(entries[0].id).toBe('new');
  });
});
describe('calendar dates and invalidation', () => {
  it('uses real calendar dates across month, leap year and DST boundaries', () => {
    expect(validCalendarDate('2026-02-30')).toBe(false); expect(validCalendarDate('2024-02-29')).toBe(true);
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28'); expect(shiftDate('2026-03-08', 1)).toBe('2026-03-09');
    expect(calendarDate('2026-09-13T23:30:00Z', 'Africa/Cairo')).toBe('2026-09-14');
  });
  it('invalidates both old and new local days for a moved activity', async () => {
    useAuthStore.setState({ user: { timezone: 'Africa/Cairo' } });
    const client = { invalidateQueries: vi.fn() };
    await invalidateActivityDays(client, '2026-09-13T23:30:00Z', '2026-09-15T04:00:00Z');
    expect(client.invalidateQueries.mock.calls).toEqual([[{ queryKey: ['daily-summary', '2026-09-14'] }], [{ queryKey: ['daily-summary', '2026-09-15'] }]]);
  });
  it('falls back to all summary days when a removed entry is not cached', async () => {
    const client = { invalidateQueries: vi.fn() }; await invalidateActivityDays(client, undefined);
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['daily-summary'] });
  });
  it('refreshes all dependent journey data after target-affecting changes', async () => {
    const client = { invalidateQueries: vi.fn() }; await invalidateJourney(client);
    for (const queryKey of [['progress'], ['daily-summary'], ['profile', 'me'], ['profile', 'targets'], ['goals']]) expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey });
  });
});
