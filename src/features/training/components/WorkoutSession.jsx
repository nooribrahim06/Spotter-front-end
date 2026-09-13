import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkout, useTrainingAction, useTrainingKeys } from '../useTraining.js';
import { workoutName, formatDate, formatTime, humanize } from '../training.domain.js';
import { Bit, Button, Elapsed, ErrorNotice, Loading, Modal, Icon } from './TrainingUI.jsx';
import ExerciseBrowser from './ExerciseBrowser.jsx';
import ExerciseMedia from './ExerciseMedia.jsx';
import TrackingEditor from './TrackingEditor.jsx';
import WorkoutMetadataDialog from './WorkoutMetadataDialog.jsx';
import WorkoutExerciseCard from './WorkoutExerciseCard.jsx';
import s from '../Training.module.css';

export default function WorkoutSession() {
  const { workoutId } = useParams(), navigate = useNavigate(), client = useQueryClient(), keys = useTrainingKeys();
  const query = useWorkout(workoutId), action = useTrainingAction();
  const [modal, setModal] = useState(null), [selectedRow, setSelectedRow] = useState(null), [detail, setDetail] = useState(null);
  const workout = query.data;
  const active = workout?.status === 'IN_PROGRESS' && !query.isError;
  const completed = workout?.exercises.filter(row => row.completed).length || 0;
  useEffect(() => { document.title = workout ? `${workoutName(workout)} — Spotter` : 'Your workout — Spotter'; }, [workout]);
  useEffect(() => {
    if (query.error?.code === 'WORKOUT_NOT_FOUND') {
      client.invalidateQueries({ queryKey: keys.active });
      client.invalidateQueries({ queryKey: keys.history });
      navigate('/app/training', { replace: true });
    }
  }, [query.error, client, navigate]);
  const close = () => { if (!action.isPending) { setModal(null); setSelectedRow(null); setDetail(null); action.reset(); } };
  const open = (name, row) => { action.reset(); setSelectedRow(row || null); setModal(name); };
  async function run(type, row) {
    try {
      await action.mutateAsync({ type, id: workoutId, rowId: row?.id, ...(type === 'update' ? { data: { completed: true } } : {}) });
      if (type === 'complete') setModal('celebrate');
      else if (type === 'cancel' || type === 'remove') setModal(null);
    } catch (error) { if (error.code === 'WORKOUT_COMPLETION_REQUIRED') setModal('blocked'); }
  }
  if (query.isPending) return <div className={s.page}><Loading /></div>;
  if (!workout) return <div className={s.page}><Link className={s.textLink} to="/app/training">Back to training</Link><ErrorNotice error={query.error} retry={query.refetch} /></div>;
  const limited = workout.exercises.length >= 50 || action.error?.code === 'WORKOUT_EXERCISE_LIMIT_REACHED';
  return <div className={s.page}>
    <Link className={s.textLink} to="/app/training"><Icon name="back" />Training</Link>
    <header className={s.sessionHeader}><div><p className={s.eyebrow}>{active ? 'IN YOUR CORNER. ALL SESSION LONG.' : 'YOUR JOURNEY / SESSION RECAP'}</p><h1>{workoutName(workout)}</h1><p className={s.muted}>{formatDate(workout.startedAt)} · Started {formatTime(workout.startedAt)}{workout.completedAt && <> · Finished {formatTime(workout.completedAt)}</>}</p></div><span className={`${s.badge} ${active ? s.liveBadge : workout.status === 'COMPLETED' ? s.doneBadge : ''}`}>{active && <span className={s.liveDot} />}{active ? 'LIVE' : humanize(workout.status)}</span></header>
    <ErrorNotice error={query.error} retry={query.refetch} />
    <div className={s.sessionLayout}>
      <div className={s.sessionMain}>
        <div className={s.sessionProgress}><div><Icon name="clock" />{active ? <Elapsed startedAt={workout.startedAt} /> : workout.durationMinutes != null ? <span>{workout.durationMinutes} min</span> : <span>Part of your journey</span>}</div><p aria-live="polite"><strong>{completed}</strong> of {workout.exercises.length} completed</p></div>
        <progress className={s.progress} value={completed} max={workout.exercises.length || 1} aria-label="Completed movements" />
        {workout.exercises.length ? <div className={s.movementList}>{workout.exercises.map((row, index) => <WorkoutExerciseCard key={row.id} row={row} index={index} active={active} busy={action.isPending} onComplete={row => run('update', row)} onEdit={row => open('editMovement', row)} onRemove={row => open('remove', row)} onDetails={exercise => { setDetail(exercise); open('details'); }} />)}</div> : <div className={s.sessionEmpty}><Bit mood="point" /><div><p className={s.eyebrow}>{active ? 'ONE MOVEMENT FIRST' : 'YOUR SESSION'}</p><h2>{active ? 'Find your rhythm.' : 'Pick it up next time.'}</h2><p>{active ? 'Add a movement. Make it yours. Then keep moving.' : 'This session has no movements. Your next session is a fresh start.'}</p></div></div>}
        {active && <Button className={s.addMovement} variant="secondary" disabled={action.isPending || limited} onClick={() => open('picker')}><Icon name="plus" />{limited ? '50-movement limit reached' : 'Add exercise'}</Button>}
        {!modal && <ErrorNotice error={action.error} />}
      </div>
      <aside className={s.sessionAside}>
        <div className={s.sessionFocus}><p className={s.eyebrow}>{active ? 'YOUR SESSION' : workout.status === 'COMPLETED' ? 'THE WORK YOU PUT IN' : 'YOUR JOURNEY CONTINUES'}</p><h2>{active ? <>One move.<br /> <span>Then the next.</span></> : workout.status === 'COMPLETED' ? <>Strong<br /><span>session.</span></> : <>Your pace.<br /><span>Always.</span></>}</h2>
          <div className={s.sessionStats}><div><strong>{workout.exercises.length}</strong><span>movements</span></div><div><strong>{completed}</strong><span>completed</span></div>{workout.durationMinutes != null && <div><strong>{workout.durationMinutes}</strong><span>minutes</span></div>}{workout.estimatedCaloriesBurned != null && <div><strong>{workout.estimatedCaloriesBurned}</strong><span>estimated kcal</span></div>}</div>
          {workout.notes && <p className={s.sessionNote}>{workout.notes}</p>}
          {active && <div className={s.asideActions}><Button variant="textButton" disabled={action.isPending} onClick={() => open('metadata')}>Edit name or note</Button><Button variant="textButton" disabled={action.isPending} onClick={() => open('cancel')}>Cancel workout</Button></div>}
        </div>
        {active && <div className={s.finishBar}><span>{completed > 0 ? 'Ready to call it a session?' : 'Complete one movement to finish.'}</span><Button variant="coral" disabled={action.isPending} onClick={() => open(completed ? 'finish' : 'blocked')}>Finish workout<Icon /></Button></div>}
      </aside>
    </div>
    {modal === 'metadata' && active && <WorkoutMetadataDialog workout={workout} onClose={close} />}
    {modal === 'picker' && active && <Modal title="Add your next movement." wide busy={action.isPending} onClose={close}><ExerciseBrowser workout={workout} action={action} onAdded={close} /></Modal>}
    {modal === 'editMovement' && active && <Modal title="Make the movement yours." busy={action.isPending} onClose={close}><TrackingEditor row={selectedRow} exercise={selectedRow.exercise} workoutId={workout.id} action={action} onSaved={close} onBack={close} disabled={!workout.exercises.some(row => row.id === selectedRow.id)} /></Modal>}
    {modal === 'details' && detail && <Modal title={detail.name} onClose={close}><div className={s.detail}><ExerciseMedia key={detail.id} exercise={detail} detail /><p>{[detail.bodyPart, detail.equipment, detail.difficulty, detail.force, detail.mechanic].filter(Boolean).map(humanize).join(' · ')}</p>{detail.primaryMuscles?.length > 0 && <p><strong>Primary muscles:</strong> {detail.primaryMuscles.join(', ')}</p>}{detail.secondaryMuscles?.length > 0 && <p><strong>Also working:</strong> {detail.secondaryMuscles.join(', ')}</p>}<h3>How to move</h3>{detail.instructions?.length ? <ol className={s.instructions}>{detail.instructions.map((line, index) => <li key={index}>{line}</li>)}</ol> : <p>Instructions aren’t available for this movement yet.</p>}</div></Modal>}
    {['cancel', 'remove', 'finish', 'blocked'].includes(modal) && active && <Modal title={modal === 'cancel' ? 'Pick it up next time?' : modal === 'remove' ? 'Remove this movement?' : modal === 'blocked' ? 'One movement first.' : 'Make it a session.'} busy={action.isPending} onClose={close}>
      <div className={s.confirmContent}>{modal === 'blocked' && <Bit mood="point" />}<p>{modal === 'cancel' ? 'This session will stay in your training as cancelled. You can start fresh whenever you’re ready.' : modal === 'remove' ? `${selectedRow.exercise.name} and its tracking will be removed from this workout.` : modal === 'blocked' ? 'Complete at least one exercise before finishing. You’ve got this.' : `${completed} of ${workout.exercises.length} movements completed. ${completed < workout.exercises.length ? 'Unfinished movements will stay in your recap as not completed. ' : ''}Your session will be saved as it is.`}</p><ErrorNotice error={action.error} /><div className={s.formActions}><Button variant="secondary" onClick={close} disabled={action.isPending}>{modal === 'blocked' ? 'Back to workout' : 'Keep training'}</Button>{modal !== 'blocked' && <Button variant={modal === 'finish' ? 'coral' : 'primary'} disabled={action.isPending} onClick={() => run(modal === 'finish' ? 'complete' : modal, selectedRow)}>{action.isPending ? 'Saving…' : modal === 'finish' ? 'Finish workout' : modal === 'cancel' ? 'Cancel workout' : 'Remove movement'}</Button>}</div></div>
    </Modal>}
    {modal === 'celebrate' && workout.status === 'COMPLETED' && <Modal title="You showed up. It counts." onClose={close}><div className={s.celebration}><Bit mood="celebrate" /><p className={s.eyebrow}>WORKOUT COMPLETE</p><h3>Strong session.</h3><p>{workout.durationMinutes != null && `${workout.durationMinutes} minutes · `}{completed} {completed === 1 ? 'movement' : 'movements'} completed</p><Button onClick={close}>See what you did<Icon /></Button></div></Modal>}
  </div>;
}

