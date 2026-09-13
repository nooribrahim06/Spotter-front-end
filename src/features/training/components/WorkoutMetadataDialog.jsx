import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingAction } from '../useTraining.js';
import { workoutName, fieldErrors } from '../training.domain.js';
import { Modal, Field, Button, ErrorNotice, Icon } from './TrainingUI.jsx';
import s from '../Training.module.css';

export default function WorkoutMetadataDialog({ workout, onClose }) {
  const action = useTrainingAction(), navigate = useNavigate();
  const [name, setName] = useState(workout?.name || ''), [notes, setNotes] = useState(workout?.notes || ''), [startedAt, setStartedAt] = useState('');
  const [errors, setErrors] = useState({});
  async function submit(event) {
    event.preventDefault();
    const validation = {};
    if (name.trim().length > 160) validation.name = 'Keep the name within 160 characters.';
    if (notes.trim().length > 1000) validation.notes = 'Keep the note within 1,000 characters.';
    if (startedAt && (!Number.isFinite(new Date(startedAt).getTime()) || new Date(startedAt).getTime() > Date.now())) validation.startedAt = 'Choose a start time that isn’t in the future.';
    if (Object.keys(validation).length) { setErrors(validation); return; }
    const data = workout ? Object.fromEntries(Object.entries({ name: name.trim() || null, notes: notes.trim() || null }).filter(([key, value]) => value !== workout[key])) : { ...(name.trim() ? { name: name.trim() } : {}), ...(notes.trim() ? { notes: notes.trim() } : {}), ...(startedAt ? { startedAt: new Date(startedAt).toISOString() } : {}) };
    if (workout && !Object.keys(data).length) { onClose(); return; }
    try {
      const result = await action.mutateAsync({ type: workout ? 'edit' : 'start', id: workout?.id, data });
      onClose();
      if (!workout) navigate(`/app/training/workouts/${result.id}`);
    } catch (error) { setErrors(fieldErrors(error, ['name', 'notes', 'startedAt'])); }
  }
  return <Modal title={workout ? 'Make it yours.' : 'Let’s get moving.'} onClose={onClose} busy={action.isPending}>
    <form className={s.form} onSubmit={submit}>
      <p className={s.muted}>{workout ? 'A name or a note. A little context for your journey.' : 'No perfect plan needed. Start now and add your first movement.'}</p>
      <fieldset className={s.fieldset} disabled={action.isPending}>
        <Field label="Workout name · optional" value={name} onChange={event => setName(event.target.value)} maxLength={160} placeholder={workout ? workoutName({ ...workout, name: null }) : 'We’ll name it for the time of day'} error={errors.name} />
        <Field label="Note · optional" error={errors.notes}><textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} maxLength={1000} aria-invalid={!!errors.notes} placeholder="How are you coming into this session?" /></Field>
        {!workout && <details className={s.more}><summary>Already started moving?</summary><Field label="Start time · leave empty for now" type="datetime-local" value={startedAt} onChange={event => setStartedAt(event.target.value)} error={errors.startedAt} /></details>}
      </fieldset>
      {errors.startedAt && <ErrorNotice error={errors.startedAt} />}
      <ErrorNotice error={action.error} />
      <div className={s.formActions}><Button variant="secondary" onClick={onClose} disabled={action.isPending}>Back</Button><Button variant={workout ? 'primary' : 'coral'} type="submit" disabled={action.isPending}>{action.isPending ? 'Saving…' : workout ? 'Save changes' : 'Start training'}<Icon /></Button></div>
    </form>
  </Modal>;
}
