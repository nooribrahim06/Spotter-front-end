import GoalModal from '../../goals/components/GoalModal.jsx';
import { measurementLabel } from '../../goals/goals.domain.js';
import { displayNumber } from '../../daily-summary/daily-summary.domain.js';
import { useProgressEntry } from '../useProgress.js';
import { JourneyError, SectionLoading } from './JourneyUI.jsx';
import styles from '../Progress.module.css';
export function EntryMetrics({ entry }) {
  return <dl className={styles.metrics}>{[['Body fat', entry.bodyFatPercentage, '%'], ['Muscle mass', entry.skeletalMuscleMassKg, 'kg'], ['Resting heart rate', entry.restingHeartRateBpm, 'bpm'], ...(entry.measurements || []).map(m => [measurementLabel(m.measurementType), m.valueCm, 'cm'])].map(([label, value, unit]) => <div key={label}><dt>{label}</dt><dd>{displayNumber(value)}{value != null && <small> {unit}</small>}</dd></div>)}</dl>;
}
export default function EntryDetail({ id, onClose }) {
  const query = useProgressEntry(id);
  return <GoalModal title="A point in your journey" eyebrow="Check-in details" onClose={onClose} closeLabel="Close check-in details"><div className={styles.scope}>{query.isPending ? <SectionLoading label="Loading check-in details" /> : query.isError ? <JourneyError error={query.error} onRetry={query.refetch} /> : <div className={styles.entryDetail}><time dateTime={query.data.recordedAt}>{new Date(query.data.recordedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</time><strong className={styles.entryWeight}>{displayNumber(query.data.weightKg)} <small>kg</small></strong><EntryMetrics entry={query.data} /><div><h3>Anything worth remembering</h3><p className={styles.notes}>{query.data.notes || 'No notes for this check-in.'}</p></div><p className={styles.muted}>A snapshot of that moment. Each new check-in adds to your story.</p></div>}</div></GoalModal>;
}
