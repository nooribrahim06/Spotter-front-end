import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore.js';
import { Field, SelectInput, TextInput } from '../../profile/components/ProfileFormControls.jsx';
import { measurementLabel } from '../../goals/goals.domain.js';
import { calendarDate, displayNumber, validCalendarDate } from '../../daily-summary/daily-summary.domain.js';
import { MEASUREMENT_TYPES, chartPoints } from '../progress.domain.js';
import { useProgressChart } from '../useProgress.js';
import { JourneyError, SectionLoading } from './JourneyUI.jsx';
import styles from '../Progress.module.css';
const METRICS = [{ value: 'weightKg', label: 'Weight', unit: 'kg' }, { value: 'bodyFatPercentage', label: 'Body fat', unit: '%' }, { value: 'skeletalMuscleMassKg', label: 'Muscle mass', unit: 'kg' }, { value: 'restingHeartRateBpm', label: 'Resting heart rate', unit: 'bpm' }, ...MEASUREMENT_TYPES.map(value => ({ value, label: measurementLabel(value), unit: 'cm' }))];
export function JourneyPlot({ items, metric, onInspect }) {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  useEffect(() => { const media = window.matchMedia('(max-width: 600px)'); const change = () => setCompact(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
  const chartWidth = compact ? 360 : 800, left = compact ? 45 : 60, right = chartWidth - (compact ? 15 : 50);
  const points = useMemo(() => chartPoints(items, metric.value), [items, metric.value]);
  const [selected, setSelected] = useState(null);
  const known = points.filter(p => p.value != null);
  if (!known.length) return <div className={styles.chartEmpty}><h3>No {metric.label.toLowerCase()} readings in this window.</h3><p>{items.length ? 'Add this metric to a check-in when you next measure it.' : 'Try a wider date range, or log a new check-in.'}</p></div>;
  const values = known.map(p => p.value), low = Math.min(...values), high = Math.max(...values), margin = Math.max((high - low) * .2, .5), min = low - margin, max = high + margin;
  const start = new Date(points[0].recordedAt).getTime(), end = new Date(points.at(-1).recordedAt).getTime();
  const x = p => end === start ? (left + right) / 2 : left + (new Date(p.recordedAt).getTime() - start) / (end - start) * (right - left);
  const y = p => 220 - ((p.value - min) / (max - min)) * 190;
  let pen = false;
  const path = points.map(p => { if (p.value == null) { pen = false; return ''; } const command = `${pen ? 'L' : 'M'}${x(p)},${y(p)}`; pen = true; return command; }).join(' ');
  const active = known.find(p => p.id === selected) || known.at(-1);
  const dateLabel = date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return <>
    <div className={styles.chartReadout} aria-live="polite"><strong>{displayNumber(active.value)} <small>{metric.unit}</small></strong><span>{dateLabel(active.recordedAt)} · {known.length} {known.length === 1 ? 'reading' : 'readings'} in this window</span></div>
    <svg className={styles.chart} viewBox={`0 0 ${chartWidth} 270`} role="img" aria-label={`${metric.label} over time. ${known.length} readings. Latest ${displayNumber(known.at(-1).value)} ${metric.unit}. Full values below.`}>
      <title>{metric.label} journey</title>
      {[0, .5, 1].map(f => <g key={f}><line x1={left} x2={right} y1={30 + f * 190} y2={30 + f * 190} className={styles.gridLine} /><text x={left - 12} y={35 + f * 190} textAnchor="end">{displayNumber(max - (max - min) * f)}</text></g>)}
      <path d={path} className={styles.trendLine} />
      {known.map(p => <g key={p.id}><circle cx={x(p)} cy={y(p)} r={p.id === active.id ? 6 : 4} className={styles.plotDot} /><circle cx={x(p)} cy={y(p)} r="14" fill="transparent" role="button" tabIndex={0} aria-label={`${dateLabel(p.recordedAt)}, ${displayNumber(p.value)} ${metric.unit}. Open check-in.`} onFocus={() => setSelected(p.id)} onMouseEnter={() => setSelected(p.id)} onClick={() => onInspect(p.id)} onKeyDown={e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); onInspect(p.id); } }}><title>{dateLabel(p.recordedAt)} · {displayNumber(p.value)} {metric.unit}</title></circle></g>)}
      <text x={left} y="255">{dateLabel(points[0].recordedAt)}</text><text x={right} y="255" textAnchor="end">{dateLabel(points.at(-1).recordedAt)}</text>
    </svg>
    <p className={styles.muted}>Select a point to open its check-in. Unmeasured values leave a gap.</p>
    <details className={styles.dataDetails}><summary>View chart readings</summary><ul>{points.map(p => <li key={p.id}><button type="button" onClick={() => onInspect(p.id)}><time dateTime={p.recordedAt}>{dateLabel(p.recordedAt)}</time><strong>{displayNumber(p.value)} {p.value != null ? metric.unit : '· Not measured'}</strong></button></li>)}</ul></details>
  </>;
}
export default function ProgressChart({ onInspect }) {
  const timezone = useAuthStore(s => s.user?.timezone), today = calendarDate(new Date(), timezone);
  const [range, setRange] = useState('3'), [metricKey, setMetric] = useState('weightKg'), [custom, setCustom] = useState({ startDate: today, endDate: today });
  const end = new Date(`${today}T12:00:00Z`), originalDay = end.getUTCDate();
  end.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() - (Number(range) || 3));
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(originalDay, lastDay));
  const filters = range === 'custom' ? custom : { startDate: end.toISOString().slice(0, 10), endDate: today };
  const valid = validCalendarDate(filters.startDate) && validCalendarDate(filters.endDate) && filters.startDate <= filters.endDate;
  const query = useProgressChart(filters, valid), metric = METRICS.find(m => m.value === metricKey);
  return <section className={styles.chartSection} aria-labelledby="journey-chart-title"><div className={styles.sectionTop}><div><p className={styles.eyebrow}>The bigger picture</p><h2 id="journey-chart-title">Your body, over time.</h2></div><div className={styles.rangeControls} role="group" aria-label="Chart date range">{[['1', '1M'], ['3', '3M'], ['6', '6M'], ['custom', 'Custom']].map(([value, label]) => <button type="button" key={value} aria-pressed={range === value} onClick={() => setRange(value)}>{label}</button>)}</div></div>
    <div className={styles.chartFilters}><Field label="Metric"><SelectInput value={metricKey} onChange={e => setMetric(e.target.value)}>{METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</SelectInput></Field>{range === 'custom' && <><Field label="From"><TextInput type="date" value={custom.startDate} onChange={e => setCustom(v => ({ ...v, startDate: e.target.value }))} /></Field><Field label="Through"><TextInput type="date" min={custom.startDate} value={custom.endDate} onChange={e => setCustom(v => ({ ...v, endDate: e.target.value }))} /></Field></>}</div>
    {!valid ? <p role="alert">Choose a valid date range with the end on or after the start.</p> : query.isPending ? <SectionLoading label="Loading progress chart" height="330px" /> : query.isError ? <JourneyError error={query.error} onRetry={query.refetch} /> : <JourneyPlot key={metricKey + JSON.stringify(filters)} items={query.data} metric={metric} onInspect={onInspect} />}
  </section>;
}
