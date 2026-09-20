import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { calendarDate, shiftDate, validCalendarDate } from '../../features/daily-summary/daily-summary.domain.js';
import DailyOverview from '../../features/daily-summary/components/DailyOverview.jsx';
import WorkoutMetadataDialog from '../../features/training/components/WorkoutMetadataDialog.jsx';
import Button from '../../components/ui/Button.jsx';
import { usePlanSchedule, useStartFromPlan } from '../../features/plans/usePlans.js';
import PlanDay from '../../features/plans/components/PlanDay.jsx';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const [startWorkout, setStartWorkout] = useState(false);
  const timezone = useAuthStore(s => s.user?.timezone);
  const today = calendarDate(new Date(), timezone);
  const rawDate = params.get('date');
  const date = validCalendarDate(rawDate) ? rawDate : today;
  const selectedToday = date === today;
  const label = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const { data: scheduleData } = usePlanSchedule(date);
  const startFromPlan = useStartFromPlan();
  const planDay = scheduleData?.day || scheduleData;
  const nutritionStyle = scheduleData?.nutritionStyle || scheduleData?.plan?.nutritionStyle || planDay?.nutritionStyle;
  const planId = scheduleData?.planId || scheduleData?.plan?.id;

  const selectDate = value => {
    if (validCalendarDate(value)) setParams(value === today ? {} : { date: value });
  };

  useEffect(() => {
    document.title = `${selectedToday ? 'Today' : label} — Spotter`;
  }, [selectedToday, label]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <p className={styles.greeting}>{selectedToday ? greeting : 'A day in your journey'}</p>
          <h1 className={styles.heading}>{selectedToday ? 'Your day.' : date > today ? 'A look ahead.' : 'Looking back.'}</h1>
          <time className={styles.date} dateTime={date}>{label}</time>
        </div>
        <div className={styles.dateControls}>
          <button type="button" className={styles.dateButton} aria-label="Previous day" onClick={() => selectDate(shiftDate(date, -1))}>‹</button>
          <input type="date" aria-label="Summary date" value={date} onChange={e => selectDate(e.target.value)} className={styles.calendar} />
          <button type="button" className={styles.dateButton} aria-label="Next day" onClick={() => selectDate(shiftDate(date, 1))}>›</button>
          {!selectedToday && <button type="button" className={styles.todayButton} onClick={() => selectDate(today)}>Today</button>}
        </div>
      </header>

      {/* ── Today's Plan (only shown if active plan covers this date) ── */}
      {scheduleData && (
        <section className={styles.planSection} aria-labelledby="today-plan-heading">
          <div className={styles.planSectionHeader}>
            <div>
              <span className={styles.planBadge}>SPOTTER&apos;S PLAN</span>
              <h2 id="today-plan-heading" className={styles.planHeading}>
                {selectedToday ? "Today's Plan" : 'Planned for this day'}
              </h2>
              <p className={styles.planSubtitle}>
                What Spotter planned for you · Tracked separately from actual logged activity
              </p>
            </div>
            <Link
              to={planId ? `/app/plans/${planId}` : '/app/plans'}
              className={styles.viewPlanLink}
            >
              View full plan →
            </Link>
          </div>
          <PlanDay
            day={planDay}
            nutritionStyle={nutritionStyle}
            isToday={selectedToday}
            isActive={true}
            scheduledDate={date}
            onStartWorkout={startFromPlan.mutate}
            startingWorkout={startFromPlan.isPending}
          />
        </section>
      )}

      <DailyOverview date={date} />
      <div className={styles.quickActions}>
        <Link to="/app/meals/new">+ Log a meal</Link>
        <Button variant="secondary" onClick={() => setStartWorkout(true)}>Start a workout</Button>
        <Link to="/app/progress?checkIn=1">+ Check In</Link>
      </div>
      {startWorkout && <WorkoutMetadataDialog onClose={() => setStartWorkout(false)} />}
    </div>
  );
}
