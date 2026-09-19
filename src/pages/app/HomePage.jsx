import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { calendarDate, shiftDate, validCalendarDate } from '../../features/daily-summary/daily-summary.domain.js';
import DailyOverview from '../../features/daily-summary/components/DailyOverview.jsx';
import WorkoutMetadataDialog from '../../features/training/components/WorkoutMetadataDialog.jsx';
import Button from '../../components/ui/Button.jsx';
import styles from './HomePage.module.css';
export default function HomePage() {
  const [params, setParams] = useSearchParams(), [startWorkout, setStartWorkout] = useState(false);
  const timezone = useAuthStore(s => s.user?.timezone);
  const today = calendarDate(new Date(), timezone), rawDate = params.get('date'), date = validCalendarDate(rawDate) ? rawDate : today;
  const selectedToday = date === today;
  const label = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const hour = new Date().getHours(), greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const selectDate = value => { if (validCalendarDate(value)) setParams(value === today ? {} : { date: value }); };
  useEffect(() => { document.title = `${selectedToday ? 'Today' : label} — Spotter`; }, [selectedToday, label]);
  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.headerContent}><p className={styles.greeting}>{selectedToday ? greeting : 'A day in your journey'}</p><h1 className={styles.heading}>{selectedToday ? 'Your day.' : date > today ? 'A look ahead.' : 'Looking back.'}</h1><time className={styles.date} dateTime={date}>{label}</time></div>
      <div className={styles.dateControls}><button type="button" className={styles.dateButton} aria-label="Previous day" onClick={() => selectDate(shiftDate(date, -1))}>‹</button><input type="date" aria-label="Summary date" value={date} onChange={e => selectDate(e.target.value)} className={styles.calendar} /><button type="button" className={styles.dateButton} aria-label="Next day" onClick={() => selectDate(shiftDate(date, 1))}>›</button>{!selectedToday && <button type="button" className={styles.todayButton} onClick={() => selectDate(today)}>Today</button>}</div>
    </header>
    <DailyOverview date={date} />
    <div className={styles.quickActions}><Link to="/app/meals/new">+ Log a meal</Link><Button variant="secondary" onClick={() => setStartWorkout(true)}>Start a workout</Button><Link to="/app/progress?checkIn=1">+ Check In</Link></div>
    {startWorkout && <WorkoutMetadataDialog onClose={() => setStartWorkout(false)} />}
  </div>;
}
