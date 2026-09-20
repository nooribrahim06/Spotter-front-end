import s from '../Plans.module.css';
import { slotLabel, prescriptionSummary } from '../plans.domain.js';

/**
 * WorkoutPrescriptionCard — Displays a planned workout for a specific day.
 *
 * Shows workout name, time slot, estimated duration, exercise list with
 * prescription summaries, and optional notes. Never shows completion state —
 * these are prescriptions only, not logged activity.
 *
 * @param {object} workout - Plan workout object
 * @param {string} [scheduledDate] - YYYY-MM-DD for the "Start workout" action
 * @param {boolean} [showStart] - Whether to show the "Start workout" button
 * @param {function} [onStart] - Callback when user clicks "Start workout"
 * @param {boolean} [startLoading] - Loading state for start mutation
 */
export default function WorkoutPrescriptionCard({ workout, scheduledDate, showStart, onStart, startLoading }) {
  if (!workout) return null;

  return (
    <div className={s.prescriptionCard}>
      <div className={s.prescriptionHeader}>
        <h4>{workout.name || 'Workout'}</h4>
        {workout.slot && <span className={s.eyebrow}>{slotLabel(workout.slot)}</span>}
      </div>

      <div className={s.prescriptionMeta}>
        {workout.estimatedDurationMinutes != null && (
          <span>~{workout.estimatedDurationMinutes} min</span>
        )}
        {workout.exercises?.length > 0 && (
          <span>{workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {workout.exercises?.length > 0 && (
        <div className={s.exerciseList}>
          {workout.exercises.map((exercise, index) => (
            <div key={exercise.id || index} className={s.exerciseRow}>
              <span className={s.exerciseNumber}>{String(index + 1).padStart(2, '0')}</span>
              <span className={s.exerciseName}>{exercise.name || exercise.exerciseName || 'Exercise'}</span>
              {prescriptionSummary(exercise) && (
                <span className={s.exerciseDetail}>{prescriptionSummary(exercise)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {workout.notes && (
        <div className={s.prescriptionNote}>{workout.notes}</div>
      )}

      {showStart && onStart && (
        <div className={s.prescriptionActions}>
          <button
            type="button"
            className={`${s.button} ${s.coral}`}
            disabled={startLoading}
            onClick={() => onStart({ planWorkoutId: workout.id, scheduledDate })}
          >
            {startLoading ? 'Starting…' : 'Start workout'}
            <Icon name="arrow" />
          </button>
        </div>
      )}
    </div>
  );
}

function Icon({ name = 'arrow' }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
