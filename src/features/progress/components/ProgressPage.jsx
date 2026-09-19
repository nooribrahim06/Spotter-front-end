import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import { BitCharacter } from '../../../components/landing/BitCharacter.jsx';
import { useLatestProgress } from '../useProgress.js';
import { displayNumber } from '../../daily-summary/daily-summary.domain.js';
import GoalProgress from './GoalProgress.jsx';
import ProgressChart from './ProgressChart.jsx';
import ProgressHistory from './ProgressHistory.jsx';
import EntryDetail, { EntryMetrics } from './EntryDetail.jsx';
import CheckInDialog from './CheckInDialog.jsx';
import { JourneyError, SectionLoading } from './JourneyUI.jsx';
import styles from '../Progress.module.css';
export default function ProgressPage() {
  const latest = useLatestProgress(), [params, setParams] = useSearchParams();
  const [checkIn, setCheckIn] = useState(params.get('checkIn') === '1'), [entryId, setEntryId] = useState(null);
  useEffect(() => { document.title = 'Progress — Spotter'; }, []);
  const closeCheckIn = () => { setCheckIn(false); if (params.has('checkIn')) { const next = new URLSearchParams(params); next.delete('checkIn'); setParams(next, { replace: true }); } };
  return <div className={`${styles.scope} ${styles.page}`}><header className={styles.pageHeader}><div><p className={styles.eyebrow}>Small check-ins. A clearer picture.</p><h1>Progress<em>.</em></h1><p>Your effort has a story. Watch it take shape.</p></div><Button className={styles.primary} onClick={() => setCheckIn(true)}>+ Check In</Button></header>
    <GoalProgress onCheckIn={() => setCheckIn(true)} />
    {latest.isPending ? <><SectionLoading label="Loading your journey" height="350px" /><SectionLoading label="Loading latest check-in" /></> : latest.isError ? <JourneyError error={latest.error} onRetry={latest.refetch} /> : latest.data === null ? <section className={styles.empty}><BitCharacter state="progress" decorative /><div><p className={styles.eyebrow}>Your first checkpoint</p><h2>Your journey starts<br />with one number.</h2><p>Log your first check-in. We’ll turn each new reading into a clearer picture of your progress.</p><Button onClick={() => setCheckIn(true)}>Log my first check-in</Button></div></section> : <>
      <ProgressChart onInspect={setEntryId} />
      <section className={styles.latest} aria-label="Latest check-in and body metrics"><div className={styles.latestLead}><p className={styles.eyebrow}>Latest check-in</p><strong>{displayNumber(latest.data.weightKg)} <small>kg</small></strong><time dateTime={latest.data.recordedAt}>{new Date(latest.data.recordedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time><button type="button" className={styles.textLink} onClick={() => setEntryId(latest.data.id)}>Open check-in ↗</button></div><div className={styles.latestMetrics}><h2>A little more context.</h2><EntryMetrics entry={latest.data} /><p className={styles.muted}>From your latest check-in. A dash means it wasn’t measured.</p></div></section>
      <ProgressHistory onInspect={setEntryId} />
    </>}
    <Link to="/app/home" className={styles.textLink}>← Back to your day</Link>
    {checkIn && <CheckInDialog onClose={closeCheckIn} />}{entryId && <EntryDetail id={entryId} onClose={() => setEntryId(null)} />}
  </div>;
}
