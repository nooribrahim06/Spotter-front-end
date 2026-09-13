export const humanize = (value) => value ? value.toLowerCase().replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()) : '';
export function workoutName(workout) {
  if (workout.name) return workout.name;
  const hour = new Date(workout.startedAt).getHours();
  return `${hour >= 5 && hour < 12 ? 'Morning' : hour < 17 && hour >= 12 ? 'Afternoon' : hour >= 17 && hour < 21 ? 'Evening' : 'Night'} workout`;
}
export const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
export const formatTime = (date) => new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export function trackingSummary(row) {
  return [row.setsCount != null && row.repsPerSet != null ? `${row.setsCount} × ${row.repsPerSet} reps` : null,
    row.weightKg != null ? `${row.weightKg} kg` : null,
    row.durationSeconds != null ? `${Math.floor(row.durationSeconds / 60) ? `${Math.floor(row.durationSeconds / 60)} min ` : ''}${row.durationSeconds % 60 ? `${row.durationSeconds % 60} sec` : ''}`.trim() : null,
    row.distanceMeters != null ? `${row.distanceMeters >= 1000 ? `${row.distanceMeters / 1000} km` : `${row.distanceMeters} m`}` : null].filter(Boolean);
}
export const metricFields = {
  SETS: 'setsCount',
  REPS: 'repsPerSet',
  WEIGHT: 'weightKg',
  DURATION: 'durationSeconds',
  DISTANCE: 'distanceMeters',
};
export const trackingFields = [...Object.values(metricFields), 'notes'];
export function trackingCapabilities(exerciseMetrics = [], configuredMetrics = []) {
  const fields = [...new Set(exerciseMetrics.filter(metric => configuredMetrics.includes(metric)).map(metric => metricFields[metric]).filter(Boolean))];
  const hasReps = fields.includes('repsPerSet');
  const blockedFields = fields.filter(field => {
    if (field === 'setsCount') return !hasReps;
    if (field === 'weightKg') return !hasReps;
    return false;
  });
  return { fields, blockedFields, editableFields: fields.filter(field => !blockedFields.includes(field)) };
}
// Preserve stored values for fields the current exercise does not let the user edit.
// These are real previous measurements, never fabricated sets/reps or hidden clears.
export function parseExerciseTracking(values, original, editableFields) {
  const merged = Object.fromEntries(trackingFields.map(field => [field,
    field === 'notes' || editableFields.includes(field) ? values[field] : original?.[field] ?? '',
  ]));
  return parseTracking(merged, original);
}
export function trackingValues(row) {
  return Object.fromEntries(trackingFields.map(key => [key, row?.[key] == null ? '' : String(row[key])]));
}
// Validate the full merged movement, then send only intentional changes on PATCH.
export function parseTracking(values, original) {
  const data = {}, errors = {};
  const rules = { setsCount: [1, 100, true], repsPerSet: [1, 1000, true], weightKg: [0, 1500, false], durationSeconds: [1, 86400, true], distanceMeters: [Number.MIN_VALUE, 1000000, false] };
  for (const [key, [min, max, integer]] of Object.entries(rules)) {
    const raw = String(values[key] ?? '').trim();
    const number = raw === '' ? null : Number(raw);
    data[key] = number;
    if (number !== null && (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number)))) {
      errors[key] = key === 'distanceMeters' ? 'Enter a distance above 0 and up to 1,000,000 m.' : `Enter ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}.`;
    }
  }
  if (data.setsCount != null && data.repsPerSet == null) {
    errors.repsPerSet = 'Sets need reps. Add reps per set or remove sets.';
  }
  if (data.weightKg != null && data.repsPerSet == null) errors.weightKg = 'Add reps before adding weight.';
  if (data.repsPerSet == null && data.durationSeconds == null && data.distanceMeters == null) errors.root = 'Add reps, a duration, or a distance to track this movement.';
  data.notes = values.notes?.trim() || null;
  if (data.notes?.length > 1000) errors.notes = 'Keep your note within 1,000 characters.';
  return { errors, data: original ? Object.fromEntries(Object.entries(data).filter(([key, value]) => value !== (original[key] ?? null))) : Object.fromEntries(Object.entries(data).filter(([, value]) => value !== null)) };
}
export function dateRange(from, to) {
  if (from && to && from > to) return { error: 'Choose an end date on or after the start date.' };
  return { params: { ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}), ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}) } };
}
export function errorMessage(error) {
  const messages = {
    INVALID_JSON: 'That request could not be read. Please try again.',
    INTERNAL_SERVER_ERROR: 'We couldn’t save that just now. Your input is still here. Please try again.',
    ENTITY_TOO_LARGE: 'That request is too large. Shorten your notes and try again.',
    TOO_MANY_REQUESTS: 'A little breather. Please wait a moment before trying again.',
    WORKOUT_COMPLETION_REQUIRED: 'One movement first. Complete at least one exercise before finishing.',
    DUPLICATE_WORKOUT_EXERCISE: 'This movement is already in your workout. Edit it from your session.',
    WORKOUT_EXERCISE_LIMIT_REACHED: 'This workout has reached its 50-movement limit.',
    EXERCISE_NOT_FOUND: 'This movement is no longer available. Choose another one.',
    WORKOUT_EXERCISE_NOT_FOUND: 'That movement has changed. We’re refreshing your session.',
    INVALID_WORKOUT_STATE: 'This workout has already ended. We’re updating your session.',
    WORKOUT_NOT_FOUND: 'We couldn’t find that workout. Your training is being refreshed.',
  };
  return messages[error?.code] || (['INVALID_SCHEMA', 'INVALID_WORKOUT_EXERCISE', 'INVALID_WORKOUT_START_TIME'].includes(error?.code) ? error.message : 'Couldn’t connect to your training. Please try again.');
}
export function fieldErrors(error, fields) {
  const result = {};
  if (['INVALID_SCHEMA', 'INVALID_WORKOUT_EXERCISE'].includes(error?.code)) {
    for (const detail of error.details || []) if (fields.includes(detail.field)) result[detail.field] = detail.message;
  }
  if (error?.code === 'INVALID_WORKOUT_START_TIME') result.startedAt = 'Choose a start time that isn’t in the future.';
  return result;
}

