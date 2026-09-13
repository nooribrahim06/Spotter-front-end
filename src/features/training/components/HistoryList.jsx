import { Link } from 'react-router-dom';
import { workoutName, formatDate, humanize } from '../training.domain.js';
import { Icon } from './TrainingUI.jsx';
import s from '../Training.module.css';

export default function HistoryList({ workouts }) {
  return <div className={s.historyList}>{workouts.map(workout => <Link key={workout.id} to={`/app/training/workouts/${workout.id}`} className={`${s.historyCard} ${workout.status === 'CANCELLED' ? s.cancelled : ''}`}>
    <div className={s.dateTile}><span>{new Date(workout.startedAt).toLocaleDateString(undefined, { month: 'short' })}</span><strong>{new Date(workout.startedAt).getDate()}</strong></div>
    <div className={s.historyInfo}><h3>{workoutName(workout)}</h3><p>{[workout.durationMinutes != null ? `${workout.durationMinutes} min` : null, `${workout.exercises.length} movements`, formatDate(workout.startedAt)].filter(Boolean).join(' · ')}</p></div>
    <span className={`${s.badge} ${workout.status === 'COMPLETED' ? s.doneBadge : ''}`}>{workout.status === 'COMPLETED' && <Icon name="check" />}{humanize(workout.status)}</span><Icon />
  </Link>)}</div>;
}
