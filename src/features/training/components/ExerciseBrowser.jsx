import { useState } from 'react';
import { useExerciseConfig, useExercises, useExercise } from '../useTraining.js';
import { humanize, fieldErrors } from '../training.domain.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { Button, Field, ErrorNotice, Loading, Pagination, Icon } from './TrainingUI.jsx';
import ExerciseMedia from './ExerciseMedia.jsx';
import TrackingEditor from './TrackingEditor.jsx';
import s from '../Training.module.css';

function ExerciseDetails({ id, workout, action, onBack, onTrack }) {
  const query = useExercise(id);
  if (query.isPending) return <Loading compact />;
  if (query.isError) return <><Button variant="textButton" onClick={onBack}>Back to movements</Button><ErrorNotice error={query.error} retry={query.error.code === 'EXERCISE_NOT_FOUND' ? undefined : query.refetch} /></>;
  const exercise = query.data, added = workout?.exercises.some(row => row.exercise.id === id);
  return <div className={s.detail}>
    <Button variant="textButton" onClick={onBack}><Icon name="back" />All movements</Button>
    <ExerciseMedia exercise={exercise} detail />
    <div><p className={s.eyebrow}>{humanize(exercise.exerciseType)} / {humanize(exercise.difficulty)}</p><h3 className={s.editorTitle}>{exercise.name}</h3><p>{[exercise.bodyPart, exercise.equipment, exercise.force, exercise.mechanic].filter(Boolean).map(humanize).join(' · ')}</p></div>
    <div className={s.muscles}>{exercise.primaryMuscles?.length > 0 && <div><p className={s.eyebrow}>Primary muscles</p><p>{exercise.primaryMuscles.join(', ')}</p></div>}{exercise.secondaryMuscles?.length > 0 && <div><p className={s.eyebrow}>Also working</p><p>{exercise.secondaryMuscles.join(', ')}</p></div>}</div>
    <section><h4>How to move</h4>{exercise.instructions?.length ? <ol className={s.instructions}>{exercise.instructions.map((line, index) => <li key={index}>{line}</li>)}</ol> : <p className={s.muted}>Instructions aren’t available for this movement yet.</p>}</section>
    {workout?.status === 'IN_PROGRESS' && <Button disabled={added || workout.exercises.length >= 50 || action?.isPending} onClick={() => onTrack(exercise)}>{added ? 'Already in your workout' : 'Track this movement'}<Icon name={added ? 'check' : 'plus'} /></Button>}
  </div>;
}
export default function ExerciseBrowser({ workout, action, onAdded, initialBodyPart = '' }) {
  const [search, setSearch] = useState(''), [filters, setFilters] = useState({ bodyPart: initialBodyPart });
  const [page, setPage] = useState(1), [selected, setSelected] = useState(null), [tracking, setTracking] = useState(null);
  const [advanced, setAdvanced] = useState(false), [unavailable, setUnavailable] = useState([]);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const config = useExerciseConfig();
  const query = useExercises({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), ...(debouncedSearch ? { search: debouncedSearch } : {}), page, limit: 12 });
  const errors = fieldErrors(query.error, ['search', 'exerciseType', 'bodyPart', 'equipment', 'difficulty', 'force', 'mechanic']);
  const active = workout?.status === 'IN_PROGRESS';
  const limit = workout?.exercises.length >= 50 || action?.error?.code === 'WORKOUT_EXERCISE_LIMIT_REACHED';
  const isUnavailable = tracking && (unavailable.includes(tracking.id) || action?.error?.code === 'EXERCISE_NOT_FOUND');
  function resetSelection() {
    if (isUnavailable) setUnavailable(current => [...current, tracking.id]);
    setTracking(null); action?.reset();
  }
  if (tracking && active) return <TrackingEditor key={tracking.id} exercise={tracking} workoutId={workout.id} action={action} disabled={isUnavailable || limit || workout.exercises.some(row => row.exercise.id === tracking.id)} onSaved={() => { setTracking(null); onAdded?.(); }} onBack={resetSelection} />;
  if (selected) return <ExerciseDetails id={selected} workout={workout} action={action} onBack={() => setSelected(null)} onTrack={exercise => { action?.reset(); setTracking(exercise); }} />;
  function selectFilter(key, value) { setFilters(current => ({ ...current, [key]: value })); setPage(1); }
  function clear() { setFilters({}); setSearch(''); setPage(1); }
  const filter = (key, configKey, label) => <Field key={key} label={label} error={errors[key]}><select value={filters[key] || ''} onChange={event => selectFilter(key, event.target.value)} disabled={!config.data}><option value="">All {label.toLowerCase()}</option>{config.data?.[configKey]?.map(value => <option key={value} value={value}>{humanize(value)}</option>)}</select></Field>;
  return <div className={s.browser}>
    <div className={s.search}><Icon name="search" /><input aria-invalid={!!errors.search} aria-describedby={errors.search ? "training-search-error" : undefined} aria-label="Search movements" placeholder="Find your next movement…" value={search} maxLength={100} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div>
    {errors.search && <p id="training-search-error" className={s.fieldError} role="alert">{errors.search}</p>}
    <div className={s.filters}>{filter('exerciseType', 'exerciseTypes', 'Types')}{filter('bodyPart', 'bodyParts', 'Body parts')}{filter('equipment', 'equipment', 'Equipment')}</div>
    <div className={s.filterActions}><Button variant="textButton" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>{advanced ? 'Fewer filters' : 'More filters'}</Button>{(search || Object.values(filters).some(Boolean)) && <Button variant="textButton" onClick={clear}>Clear filters</Button>}</div>
    {advanced && <div className={s.filters}>{filter('difficulty', 'difficulties', 'Difficulties')}{filter('force', 'forces', 'Forces')}{filter('mechanic', 'mechanics', 'Mechanics')}</div>}
    <ErrorNotice error={config.error} retry={config.refetch} />
    {limit && <p className={s.notice}>You’ve reached 50 movements. Remove a movement from your session to add another.</p>}
    {query.isPending ? <Loading compact /> : query.isError ? <ErrorNotice error={query.error} retry={query.refetch} /> : <>
      <p className={s.resultCount} role="status">{query.data.pagination.totalItems} movements{active ? ' · Make room for what moves you.' : ''}</p>
      {!query.data.items.length ? <div className={s.empty}><Icon name="search" /><h3>No movements match those filters.</h3><p>Try another name or give your search a little more room.</p><Button variant="secondary" onClick={clear}>Clear filters</Button></div> : <div className={s.exerciseGrid}>{query.data.items.map(exercise => {
        const added = workout?.exercises.some(row => row.exercise.id === exercise.id);
        return <article className={s.exerciseCard} key={exercise.id}>
          <ExerciseMedia key={exercise.id} exercise={exercise} />
          <div className={s.exerciseInfo}><p className={s.eyebrow}>{humanize(exercise.bodyPart)}</p><button className={s.exerciseName} onClick={() => setSelected(exercise.id)}>{exercise.name}</button><p className={s.muted}>{humanize(exercise.equipment)} · {humanize(exercise.difficulty)}</p></div>
          <div className={s.exerciseCardActions}><Button variant="textButton" onClick={() => setSelected(exercise.id)} aria-label={`View ${exercise.name}`}>View movement</Button>{active && <Button variant={added ? 'addedButton' : 'iconButton'} aria-label={added ? `${exercise.name} already added` : `Add ${exercise.name}`} disabled={added || limit || action?.isPending || unavailable.includes(exercise.id)} onClick={() => { action.reset(); setTracking(exercise); }}><Icon name={added ? 'check' : 'plus'} /></Button>}</div>
        </article>;
      })}</div>}
      <Pagination pagination={query.data.pagination} onPage={setPage} busy={query.isFetching || debouncedSearch !== search.trim()} />
    </>}
  </div>;
}

