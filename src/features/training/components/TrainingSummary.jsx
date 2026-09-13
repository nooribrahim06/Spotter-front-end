import { Link } from 'react-router-dom';
import { useActiveWorkout, useTrainingHistory } from '../useTraining.js';
import { Button, ErrorNotice, Loading, Icon } from './TrainingUI.jsx';
import HistoryList from './HistoryList.jsx';
import s from '../Training.module.css';

export default function TrainingSummary({ date, isToday, onStartWorkout }) {
  // The API expects 'from' and 'to' as valid ISO 8601 strings
  const history = useTrainingHistory({ 
    from: new Date(`${date}T00:00:00`).toISOString(), 
    to: new Date(`${date}T23:59:59.999`).toISOString()
  });
  const active = useActiveWorkout();
  
  if (history.isPending || active.isPending) {
    return <Loading compact />;
  }

  if (history.isError || active.isError) {
    const error = history.error || active.error;
    return (
      <ErrorNotice 
        error={error} 
        retry={() => {
          if (history.isError) history.refetch();
          if (active.isError) active.refetch();
        }} 
      />
    );
  }

  const workouts = history.data?.items || [];
  const completedCount = workouts.filter(w => w.status === 'COMPLETED').length;
  
  // Show active workout only if it's the current active workout and not completed/cancelled
  const hasActiveWorkout = active.data && active.data.status === 'IN_PROGRESS';
  
  // If we have an active workout, we can show a specific banner for it
  const activeWorkout = active.data;
  const isActiveOnThisDate = activeWorkout && activeWorkout.startedAt.startsWith(date);

  return (
    <section className={s.recent}>
      <div className={s.sectionHeader}>
        <div>
          <p className={s.eyebrow}>TRAINING</p>
          <h2>{workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}</h2>
          {completedCount > 0 && <p className={s.eyebrow} style={{marginTop: '0.2rem'}}>{completedCount} completed</p>}
        </div>
        <Link className={s.textLink} to="/app/training/history" aria-label="View all training">
          View all<Icon />
        </Link>
      </div>
      
      {hasActiveWorkout && (
        <div className={s.firstSession} style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(239, 106, 95, 0.1), rgba(255,255,255,1))' }}>
          <div>
            <h3>Active Session</h3>
            <p>{isActiveOnThisDate ? 'You started a workout today.' : 'You have an ongoing workout from another day.'}</p>
          </div>
          <Link className={`${s.button} ${s.coral}`} to={`/app/training/workouts/${activeWorkout.id}`}>
            Continue workout<Icon />
          </Link>
        </div>
      )}

      {workouts.length > 0 ? (
        <HistoryList workouts={workouts} />
      ) : (
        <div className={s.firstSession}>
          <span className={s.firstSessionMark}>01</span>
          <div>
            <h3>Rest day?</h3>
            <p>No workouts recorded for this date.</p>
          </div>
          {isToday && !hasActiveWorkout && (
            <Button variant="coral" onClick={onStartWorkout}>
              Start workout<Icon />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
