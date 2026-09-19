import { calendarDate } from '../daily-summary/daily-summary.domain.js';
export const MEASUREMENT_TYPES = ['WAIST', 'ABDOMEN', 'CHEST', 'HIPS', 'NECK', 'SHOULDERS', 'LEFT_UPPER_ARM', 'RIGHT_UPPER_ARM', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'LEFT_THIGH', 'RIGHT_THIGH', 'LEFT_CALF', 'RIGHT_CALF'];
export function localDateTime(date = new Date()) { return `${calendarDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }
export function withBrowserOffset(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const offset = -date.getTimezoneOffset(), pad = n => String(n).padStart(2, '0');
  return `${value.length === 16 ? `${value}:00` : value}${offset >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
}
export function validateCheckIn(values, latest, now = new Date()) {
  const errors = {}, number = (field, min, max, required = false) => {
    const raw = values[field];
    if (!required && (raw === '' || raw == null)) return;
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n) || n < min || n > max) errors[field] = `Use a number between ${min} and ${max}.`;
  };
  number('weightKg', 20, 500, true); number('bodyFatPercentage', 2, 75); number('skeletalMuscleMassKg', 5, 150); number('restingHeartRateBpm', 25, 250);
  if (values.skeletalMuscleMassKg !== '' && Number(values.skeletalMuscleMassKg) > Number(values.weightKg)) errors.skeletalMuscleMassKg = 'Muscle mass cannot exceed your weight.';
  if (values.restingHeartRateBpm !== '' && values.restingHeartRateBpm != null && !Number.isInteger(Number(values.restingHeartRateBpm))) errors.restingHeartRateBpm = 'Use a whole number of beats per minute.';
  if (values.recordedAt) {
    const time = new Date(values.recordedAt);
    if (Number.isNaN(time.getTime())) errors.recordedAt = 'Choose a valid date and time.';
    else if (time > now) errors.recordedAt = 'Choose a time that has already happened.';
    else if (latest && time < new Date(latest.recordedAt)) errors.recordedAt = 'Choose a time at or after your latest check-in.';
  }
  if ((values.notes || '').trim().length > 1000) errors.notes = 'Keep notes within 1,000 characters.';
  const measurements = values.measurements || [];
  if (measurements.length > 14 || new Set(measurements.map(m => m.measurementType)).size !== measurements.length) errors.measurements = 'Use each measurement once, up to 14 measurements.';
  measurements.forEach((m, index) => { if (!MEASUREMENT_TYPES.includes(m.measurementType) || !m.valueCm || !Number.isFinite(Number(m.valueCm)) || Number(m.valueCm) < 5 || Number(m.valueCm) > 400) errors[`measurements.${index}.valueCm`] = 'Use a measurement between 5 and 400 cm.'; });
  return errors;
}
export function checkInPayload(values) {
  const payload = { weightKg: Number(values.weightKg) };
  for (const field of ['bodyFatPercentage', 'skeletalMuscleMassKg', 'restingHeartRateBpm']) if (values[field] !== '' && values[field] != null) payload[field] = Number(values[field]);
  if (values.recordedAt) payload.recordedAt = withBrowserOffset(values.recordedAt);
  if (values.notes?.trim()) payload.notes = values.notes.trim();
  if (values.measurements?.length) payload.measurements = values.measurements.map(m => ({ measurementType: m.measurementType, valueCm: Number(m.valueCm) }));
  return payload;
}
export function metricValue(entry, metric) { return MEASUREMENT_TYPES.includes(metric) ? entry.measurements?.find(m => m.measurementType === metric)?.valueCm ?? null : entry[metric] ?? null; }
export function chartPoints(items, metric) { return [...items].reverse().map(entry => ({ ...entry, value: metricValue(entry, metric) })); }
export function progressError(error) {
  const data = error?.response?.data;
  return { code: data?.code || error?.code, status: error?.response?.status || error?.status, details: data?.details || error?.details };
}
