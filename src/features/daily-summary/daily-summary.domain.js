const pad = value => String(value).padStart(2, '0');
export function calendarDate(value = new Date(), timezone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
      const part = type => parts.find(item => item.type === type).value;
      return `${part('year')}-${part('month')}-${part('day')}`;
    } catch { /* Browser calendar is a display fallback; the API handles missing timezone. */ }
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function shiftDate(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export const displayNumber = (value, digits = 1) => value == null ? '—' : new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
