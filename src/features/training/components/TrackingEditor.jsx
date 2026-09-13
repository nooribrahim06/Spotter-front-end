import { useState } from 'react';
import { trackingValues, parseExerciseTracking, trackingCapabilities, fieldErrors, humanize, trackingSummary } from '../training.domain.js';
import { useExerciseConfig } from '../useTraining.js';
import { Button, Field, ErrorNotice, Icon } from './TrainingUI.jsx';
import s from '../Training.module.css';

export default function TrackingEditor({ exercise, row, action, workoutId, onSaved, onBack, disabled = false }) {
  const config = useExerciseConfig();
  const { fields, blockedFields, editableFields } = trackingCapabilities(exercise.trackingMetrics, config.data?.trackingMetrics);
  const [durationUnit, setDurationUnit] = useState(row?.durationSeconds && row.durationSeconds % 60 ? 'seconds' : 'minutes');
  const [distanceUnit, setDistanceUnit] = useState(row?.distanceMeters != null && row.distanceMeters < 1000 ? 'meters' : 'kilometers');
  const [values, setValues] = useState(() => {
    const initial = trackingValues(row);
    if (initial.durationSeconds && durationUnit === 'minutes') initial.durationSeconds = String(Number(initial.durationSeconds) / 60);
    if (initial.distanceMeters && distanceUnit === 'kilometers') initial.distanceMeters = String(Number(initial.distanceMeters) / 1000);
    return initial;
  });
  const [errors, setErrors] = useState({});
  const [completed, setCompleted] = useState(row?.completed || false);
  const busy = action.isPending;
  const unavailable = !config.data?.trackingMetrics || !editableFields.length;
  const change = key => event => { setValues(current => ({ ...current, [key]: event.target.value })); setErrors(current => ({ ...current, [key]: undefined })); };
  const input = (key, label, min, max, step = 1) => fields.includes(key) && <Field label={label} type="number" inputMode={step === 1 ? 'numeric' : 'decimal'} value={values[key]} onChange={change(key)} min={min} max={max} step={step} error={errors[key]} disabled={blockedFields.includes(key)} />;
  const blockedLabels = blockedFields.map(field => ({ setsCount: 'sets', repsPerSet: 'reps', weightKg: 'weight' })[field]);
  const availableLabels = editableFields.map(field => ({ durationSeconds: 'duration', distanceMeters: 'distance' })[field]).filter(Boolean);
  const preservedValues = row ? Object.fromEntries(Object.entries(row).filter(([field]) => !editableFields.includes(field))) : {};
  const preservedSummary = trackingSummary(preservedValues);

  async function submit(event) {
    event.preventDefault();
    if (busy || disabled || unavailable) return;
    const canonical = { ...values,
      durationSeconds: values.durationSeconds === '' ? '' : Math.round(Number(values.durationSeconds) * (durationUnit === 'minutes' ? 60 : 1) * 1e9) / 1e9,
      distanceMeters: values.distanceMeters === '' ? '' : Number(values.distanceMeters) * (distanceUnit === 'kilometers' ? 1000 : 1),
    };
    const parsed = parseExerciseTracking(canonical, row, editableFields);
    if (Object.keys(parsed.errors).length) {
      const hiddenErrors = Object.entries(parsed.errors).filter(([field]) => field !== 'root' && field !== 'notes' && !editableFields.includes(field));
      setErrors({ ...parsed.errors, ...(hiddenErrors.length ? { root: 'The saved tracking cannot be updated with this movement’s current options. Please try again after its tracking options are corrected.' } : {}) });
      return;
    }
    const data = { ...parsed.data, ...(row ? (completed !== row.completed ? { completed } : {}) : { exerciseId: exercise.id }) };
    if (row && !Object.keys(data).length) { onSaved(); return; }
    try { await action.mutateAsync({ type: row ? 'update' : 'add', id: workoutId, rowId: row?.id, data }); onSaved(); }
    catch (error) { setErrors(fieldErrors(error, [...fields, 'notes'])); }
  }
  return <form onSubmit={submit} className={s.form}>
    <div><p className={s.eyebrow}>{humanize(exercise.bodyPart)} / {humanize(exercise.equipment)}</p><h3 className={s.editorTitle}>{exercise.name}</h3><p className={s.muted}>Your movement, your numbers. Track the whole movement here.</p></div>
    {config.isPending && <p role="status" className={s.notice}>Loading this movement’s tracking options…</p>}
    <ErrorNotice error={config.error} retry={config.refetch} />
    {config.data && blockedFields.length > 0 && <p className={s.notice} role="status">{humanize(blockedLabels.join(', '))} tracking isn’t available for this movement yet.{availableLabels.length > 0 && ` You can log ${availableLabels.join(' and ')} for now.`}</p>}
    {config.data && unavailable && <p className={s.notice}>Tracking isn’t available for this movement yet. Choose another movement or try again later.</p>}
    {preservedSummary.length > 0 && <p className={s.muted}>Previously saved: {preservedSummary.join(' · ')}. These values will be kept.</p>}
    <fieldset disabled={busy || disabled || unavailable} className={s.fieldset}>
      {fields.some(field => ['setsCount', 'repsPerSet', 'weightKg'].includes(field)) && <div className={s.inputGrid}>{input('setsCount', 'Sets', 1, 100)}{input('repsPerSet', 'Reps per set', 1, 1000)}{input('weightKg', 'Weight · kg', 0, 1500, 'any')}</div>}
      {(fields.includes('durationSeconds') || fields.includes('distanceMeters')) && <div className={s.measurements}>
        {fields.includes('durationSeconds') && <div className={s.unitPair}>
          {input('durationSeconds', `Duration · ${durationUnit}`, durationUnit === 'minutes' ? 1 / 60 : 1, durationUnit === 'minutes' ? 1440 : 86400, durationUnit === 'minutes' ? 'any' : 1)}
          <Field label="Duration unit"><select value={durationUnit} onChange={event => { const next = event.target.value; setValues(current => ({ ...current, durationSeconds: current.durationSeconds === '' ? '' : String(Number(current.durationSeconds) * (next === 'minutes' ? 1 / 60 : 60)) })); setDurationUnit(next); }}><option value="minutes">min</option><option value="seconds">sec</option></select></Field>
        </div>}
        {fields.includes('distanceMeters') && <div className={s.unitPair}>
          {input('distanceMeters', `Distance · ${distanceUnit}`, undefined, distanceUnit === 'kilometers' ? 1000 : 1000000, 'any')}
          <Field label="Distance unit"><select value={distanceUnit} onChange={event => { const next = event.target.value; setValues(current => ({ ...current, distanceMeters: current.distanceMeters === '' ? '' : String(Number(current.distanceMeters) * (next === 'kilometers' ? 1 / 1000 : 1000)) })); setDistanceUnit(next); }}><option value="kilometers">km</option><option value="meters">m</option></select></Field>
        </div>}
      </div>}
      <Field label="Movement note · optional" error={errors.notes}><textarea value={values.notes} onChange={change('notes')} maxLength={1000} rows={2} aria-invalid={!!errors.notes} placeholder="Something to remember for next time…" /></Field>
      {row && <label className={s.checkField}><input type="checkbox" checked={completed} onChange={event => setCompleted(event.target.checked)} />Movement completed</label>}
    </fieldset>
    <ErrorNotice error={errors.root || action.error} />
    <div className={s.formActions}><Button variant="secondary" onClick={onBack} disabled={busy}>Back</Button><Button type="submit" disabled={busy || disabled || unavailable}>{busy ? 'Saving movement…' : row ? 'Save movement' : 'Add to workout'}<Icon name={row ? 'check' : 'plus'} /></Button></div>
  </form>;
}
