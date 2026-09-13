import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage } from '../training.domain.js';
import runningBit from '../../../assets/identity/WEBP/spotter-muscle-lets-go_768x512.webp';
import victoryBit from '../../../assets/identity/06_celebrating/WEBP/06_celebrating_392x512.webp';
import pointingBit from '../../../assets/identity/02_pointing/WEBP/02_pointing_288x384.webp';
import s from '../Training.module.css';

export function Icon({ name = 'arrow', ...props }) {
  const shapes = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    movement: <><path d="m7 7 10 10M3 7l4-4m10 18 4-4M4 10l6-6m4 16 6-6" /></>,
    play: <path d="m9 5 10 7-10 7Z" />,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name]}</svg>;
}
export function Bit({ mood = 'go', className = '' }) {
  return <img className={`${s.bit} ${className}`} src={mood === 'celebrate' ? victoryBit : mood === 'point' ? pointingBit : runningBit} alt="" />;
}
export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button type="button" className={`${s.button} ${s[variant]} ${className}`} {...props}>{children}</button>;
}
export function Modal({ title, eyebrow = 'YOUR JOURNEY / TRAINING', children, onClose, busy = false, wide = false }) {
  const ref = useRef(null), titleId = useId();
  useEffect(() => {
    const previous = document.activeElement, dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; previous?.focus?.(); };
  }, []);
  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const focusable = [...ref.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], summary, [tabindex="0"]')].filter(element => element.getClientRects().length > 0);
    const first = focusable[0], last = focusable.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return createPortal(<dialog onKeyDown={trapFocus} ref={ref} className={`${s.dialog} ${wide ? s.wideDialog : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className={s.dialogHeader}><div><p className={s.eyebrow}>{eyebrow}</p><h2 id={titleId}>{title}</h2></div><Button variant="iconButton" aria-label="Close dialog" onClick={onClose} disabled={busy}><Icon name="close" /></Button></header>
    <div className={s.dialogBody}>{children}</div>
  </dialog>, document.body);
}
export function Field({ label, error, children, ...props }) {
  const id = useId();
  return <label className={s.field}><span>{label}</span>{children ? cloneElement(children, { 'aria-invalid': !!error, 'aria-describedby': error ? id : undefined }) : <input aria-invalid={!!error} aria-describedby={error ? id : undefined} {...props} />}{error && <span id={id} className={s.fieldError} role="alert">{error}</span>}</label>;
}
export function ErrorNotice({ error, retry }) {
  if (!error) return null;
  return <div className={s.error} role="alert"><p>{typeof error === 'string' ? error : errorMessage(error)}</p>{retry && <Button variant="secondary" onClick={retry}>Try again</Button>}</div>;
}
export function Loading({ compact = false }) {
  return <div role="status" aria-label="Loading training" className={s.skeletons}><div className={s.skeleton} style={{ height: compact ? 120 : 260 }} /><div className={s.skeleton} /><div className={s.skeleton} /></div>;
}
export function Elapsed({ startedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const minutes = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
  return <span>{minutes < 1 ? 'Just started' : `${minutes} min elapsed`}</span>;
}
export function Pagination({ pagination, onPage, busy }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return <nav className={s.pagination} aria-label="Results pages"><Button variant="secondary" disabled={!pagination.hasPreviousPage || busy} onClick={() => onPage(pagination.page - 1)}>Previous</Button><span>Page {pagination.page} of {pagination.totalPages}</span><Button variant="secondary" disabled={!pagination.hasNextPage || busy} onClick={() => onPage(pagination.page + 1)}>Next</Button></nav>;
}


