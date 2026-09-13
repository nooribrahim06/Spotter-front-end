import { trackingSummary, humanize } from '../training.domain.js';
import { Button, Icon } from './TrainingUI.jsx';
import ExerciseMedia from './ExerciseMedia.jsx';
import s from '../Training.module.css';

export default function WorkoutExerciseCard({ row, index, active, busy, onComplete, onEdit, onRemove, onDetails }) {
  return <article className={`${s.movementCard} ${row.completed ? s.completedCard : ''}`}>
    <div className={s.movementNumber}>{row.completed ? <Icon name="check" /> : String(index + 1).padStart(2, '0')}</div>
    <div className={s.movementPreview}><ExerciseMedia exercise={row.exercise} /></div>
    <div className={s.movementContent}><p className={s.eyebrow}>{humanize(row.exercise.bodyPart)}{row.completed ? ' / COMPLETED' : ''}</p><button className={s.exerciseName} onClick={() => onDetails(row.exercise)}>{row.exercise.name}</button><div className={s.trackingSummary}>{trackingSummary(row).map(value => <span key={value}>{value}</span>)}</div>{row.notes && <p className={s.movementNote}>{row.notes}</p>}</div>
    {active && <div className={s.movementActions}>{row.completed ? <span className={`${s.badge} ${s.doneBadge}`}><Icon name="check" />Completed</span> : <Button variant="completeButton" disabled={busy} onClick={() => onComplete(row)}><Icon name="check" />Complete</Button>}<div className={s.smallActions}><Button variant="textButton" disabled={busy} onClick={() => onEdit(row)} aria-label={`Edit ${row.exercise.name}`}>Edit</Button><Button variant="textButton" disabled={busy} onClick={() => onRemove(row)} aria-label={`Remove ${row.exercise.name}`}>Remove</Button></div></div>}
    {!active && <span className={`${s.badge} ${row.completed ? s.doneBadge : ''}`}>{row.completed ? 'Completed' : 'Not completed'}</span>}
  </article>;
}
