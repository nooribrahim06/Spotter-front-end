import { useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import { useProgressHistory } from '../useProgress.js';
import { displayNumber } from '../../daily-summary/daily-summary.domain.js';
import { JourneyError, SectionLoading } from './JourneyUI.jsx';
import styles from '../Progress.module.css';
export default function ProgressHistory({ onInspect }) {
  const [page, setPage] = useState(1), query = useProgressHistory({ page, limit: 10 });
  return <section className={styles.historySection} aria-labelledby="check-in-history"><div className={styles.sectionTop}><div><p className={styles.eyebrow}>Your evidence, collected</p><h2 id="check-in-history">Check-in history</h2></div>{query.data && <span>{query.data.pagination.totalItems} check-ins</span>}</div>
    {query.isPending ? <SectionLoading label="Loading check-in history" height="250px" /> : query.isError ? <JourneyError error={query.error} onRetry={query.refetch} /> : <>
      {query.data.items.length ? <ol className={styles.historyList}>{query.data.items.map((entry, index, items) => {
        const older = items[index + 1], delta = older ? Math.round((entry.weightKg - older.weightKg) * 100) / 100 : null;
        return <li key={entry.id}><button type="button" className={styles.historyRow} onClick={() => onInspect(entry.id)}><span className={styles.historyDate}><time dateTime={entry.recordedAt}>{new Date(entry.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time><small>{new Date(entry.recordedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</small></span><strong>{displayNumber(entry.weightKg)} <small>kg</small></strong><span className={styles.historyDelta}>{delta != null ? `${delta > 0 ? '+' : ''}${displayNumber(delta)} kg` : '—'}<small>{delta != null ? 'from previous check-in' : 'No comparison in this page'}</small></span><span className={styles.historyExtra}>{entry.bodyFatPercentage != null ? `${displayNumber(entry.bodyFatPercentage)}% body fat` : entry.measurements?.length ? `${entry.measurements.length} measurements` : 'Weight check-in'}</span><span aria-hidden="true">↗</span></button></li>;
      })}</ol> : <p className={styles.notice}>No check-ins on this page yet.</p>}
      <nav className={styles.pagination} aria-label="Check-in history pages"><Button variant="secondary" disabled={!query.data.pagination.hasPreviousPage} onClick={() => setPage(p => p - 1)}>Previous</Button><span>Page {page} of {Math.max(1, query.data.pagination.totalPages)}</span><Button variant="secondary" disabled={!query.data.pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next</Button></nav>
    </>}
  </section>;
}
