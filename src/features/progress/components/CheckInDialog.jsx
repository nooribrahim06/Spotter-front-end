import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GoalModal from '../../goals/components/GoalModal.jsx';
import { Field, TextInput, SelectInput, Textarea } from '../../profile/components/ProfileFormControls.jsx';
import Button from '../../../components/ui/Button.jsx';
import { BitCharacter } from '../../../components/landing/BitCharacter.jsx';
import { measurementLabel } from '../../goals/goals.domain.js';
import { useCreateProgress, useLatestProgress } from '../useProgress.js';
import { MEASUREMENT_TYPES, checkInPayload, validateCheckIn, localDateTime, progressError } from '../progress.domain.js';
import styles from '../Progress.module.css';
export default function CheckInDialog({ onClose }) {
  const latest = useLatestProgress(), mutation = useCreateProgress();
  const [values, setValues] = useState({ weightKg: '', recordedAt: '', bodyFatPercentage: '', skeletalMuscleMassKg: '', restingHeartRateBpm: '', notes: '', measurements: [] });
  const [errors, setErrors] = useState({}), [message, setMessage] = useState(''), [more, setMore] = useState(false);
  const errorRef = useRef(null), successRef = useRef(null), submitting = useRef(false);
  useEffect(() => { if (mutation.isSuccess) successRef.current?.focus(); }, [mutation.isSuccess]);
  useEffect(() => { if (message) errorRef.current?.focus(); }, [message, errors]);
  const set = field => event => { setValues(v => ({ ...v, [field]: event.target.value })); };
  const close = () => { if (!submitting.current) onClose(); };
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const next = validateCheckIn(values, latest.data); setErrors(next);
    if (Object.keys(next).length) { setMore(true); setMessage('Check the highlighted fields, then try again.'); return; }
    submitting.current = true; setMessage('');
    try { await mutation.mutateAsync(checkInPayload(values)); }
    catch (error) {
      const { code, details } = progressError(error);
      if (code === 'INVALID_PROGRESS_DATE') { setErrors({ recordedAt: 'Choose a time at or after your latest check-in, and no later than now.' }); setMessage('That time overlaps your saved timeline. Adjust the date and try again.'); latest.refetch(); }
      else if (code === 'BODY_PROFILE_NOT_FOUND') setMessage('Set up your body basics in Profile before logging a check-in.');
      else if (code === 'INVALID_SCHEMA') { setErrors(Object.fromEntries((Array.isArray(details) ? details : []).map(d => [d.field, d.message]))); setMore(true); setMessage('Some details need a second look. Check your values and date.'); }
      else if (error.response?.status === 401) setMessage('Your session has ended. Sign in again to save this check-in.');
      else setMessage('We couldn’t save your check-in. Your details are still here—please try again.');
    } finally { submitting.current = false; }
  }
  const updateMeasurement = (index, field, value) => setValues(v => ({ ...v, measurements: v.measurements.map((m, i) => i === index ? { ...m, [field]: value } : m) }));
  return <GoalModal title={mutation.isSuccess ? 'Check-in logged.' : 'How are we doing today?'} eyebrow="Your progress · A little evidence goes a long way" onClose={close} closeLabel="Close check-in">
    <div className={styles.scope}>
      {mutation.isSuccess ? <div className={styles.success} role="status"><BitCharacter state="victory" decorative /><h3>Another point in your journey.</h3><p>Your timeline and daily targets are up to date.</p><Button ref={successRef} onClick={onClose}>Back to my journey</Button></div> :
      <form onSubmit={submit} noValidate className={styles.checkForm}>
        {message && <div ref={errorRef} tabIndex={-1} role="alert" className={styles.formError}><strong>{message}</strong>{progressError(mutation.error).code === 'BODY_PROFILE_NOT_FOUND' && <Link to="/app/profile">Open profile →</Link>}{mutation.error?.response?.status === 401 && <Link to="/login">Sign in →</Link>}</div>}
        <fieldset disabled={mutation.isPending} className={styles.fields}>
          <Field label="Weight (kg)" hint="The only required number. Measure it fresh each time." error={errors.weightKg}><TextInput type="number" min="20" max="500" step="any" inputMode="decimal" required value={values.weightKg} onChange={set('weightKg')} placeholder={latest.data?.weightKg == null ? 'e.g. 78.4' : `Last check-in: ${latest.data.weightKg}`} /></Field>
          <Field label="Date & time" hint="Leave empty to log now. Uses your device’s timezone." error={errors.recordedAt}><TextInput type="datetime-local" max={localDateTime()} value={values.recordedAt} onChange={set('recordedAt')} /></Field>
          <button type="button" className={styles.disclosure} aria-expanded={more} aria-controls="check-in-details" onClick={() => setMore(v => !v)}>{more ? '− Less detail' : '+ Add more detail'}<span>Skip anything you didn’t measure.</span></button>
          {more && <div id="check-in-details" className={styles.fields}>
            <div className={styles.formGrid}>{[['bodyFatPercentage', 'Body fat (%)', 2, 75], ['skeletalMuscleMassKg', 'Muscle mass (kg)', 5, 150], ['restingHeartRateBpm', 'Resting heart rate (bpm)', 25, 250]].map(([field, label, min, max]) => <Field key={field} label={label} error={errors[field]}><TextInput type="number" inputMode="decimal" step={field === 'restingHeartRateBpm' ? '1' : 'any'} min={min} max={max} value={values[field]} onChange={set(field)} /></Field>)}</div>
            <div><h3>Body measurements</h3><p className={styles.muted}>Only add the measurements you took.</p></div>
            {values.measurements.map((m, index) => <div key={index} className={styles.measurementRow}>
              <Field label="Measurement"><SelectInput value={m.measurementType} onChange={e => updateMeasurement(index, 'measurementType', e.target.value)}>{MEASUREMENT_TYPES.filter(type => type === m.measurementType || !values.measurements.some(row => row.measurementType === type)).map(type => <option key={type} value={type}>{measurementLabel(type)}</option>)}</SelectInput></Field>
              <Field label="Value (cm)" error={errors[`measurements.${index}.valueCm`]}><TextInput type="number" inputMode="decimal" step="any" min="5" max="400" value={m.valueCm} onChange={e => updateMeasurement(index, 'valueCm', e.target.value)} /></Field>
              <Button variant="ghost" aria-label={`Remove ${measurementLabel(m.measurementType)}`} onClick={() => setValues(v => ({ ...v, measurements: v.measurements.filter((_, i) => i !== index) }))}>×</Button>
            </div>)}
            {errors.measurements && <p role="alert">{errors.measurements}</p>}
            <Button variant="secondary" disabled={values.measurements.length >= 14} onClick={() => setValues(v => ({ ...v, measurements: [...v.measurements, { measurementType: MEASUREMENT_TYPES.find(type => !v.measurements.some(m => m.measurementType === type)), valueCm: '' }] }))}>+ Add measurement</Button>
            <Field label="Anything worth remembering?" hint={`${values.notes.length} / 1,000 characters`} error={errors.notes}><Textarea rows={3} maxLength={1000} value={values.notes} onChange={set('notes')} /></Field>
          </div>}
        </fieldset>
        <footer className={styles.formActions}><Button variant="ghost" onClick={close} disabled={mutation.isPending}>Cancel</Button><Button type="submit" isLoading={mutation.isPending}>Log check-in</Button></footer>
      </form>}
    </div>
  </GoalModal>;
}
