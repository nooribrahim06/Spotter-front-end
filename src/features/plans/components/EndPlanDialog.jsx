import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import s from '../Plans.module.css';
import { useEndPlan } from '../usePlans.js';
import { planTitle } from '../plans.domain.js';

/**
 * EndPlanDialog — Confirms ending the active plan.
 *
 * Ending a plan stops future prescriptions but preserves all history.
 */
export default function EndPlanDialog({ plan, onClose, onSuccess }) {
  const ref = useRef(null);
  const titleId = useId();
  const end = useEndPlan();

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.showModal();
    return () => { ref.current?.close(); document.body.style.overflow = previousOverflow; previous?.focus?.(); };
  }, []);

  const busy = end.isPending;

  function handleEnd() {
    end.mutate(plan.id, {
      onSuccess: () => { onSuccess?.(); onClose(); },
    });
  }

  return createPortal(
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}
    >
      <header className={s.dialogHeader}>
        <div>
          <p className={s.eyebrow}>PLANS</p>
          <h2 id={titleId}>End this plan?</h2>
        </div>
        <button type="button" className={`${s.button} ${s.iconButton}`} aria-label="Close dialog" onClick={onClose} disabled={busy}>
          <CloseIcon />
        </button>
      </header>
      <div className={s.dialogBody}>
        <div className={s.confirmContent}>
          <p>
            Ending <strong>{planTitle(plan)}</strong> will stop future training and
            nutrition prescriptions. Everything you've already logged stays in your history.
          </p>

          {end.isError && (
            <div className={s.error} role="alert">
              <p>{errorMessage(end.error)}</p>
            </div>
          )}
        </div>

        <div className={s.dialogActions}>
          <button type="button" className={`${s.button} ${s.secondary}`} onClick={onClose} disabled={busy}>
            Keep going
          </button>
          <button type="button" className={`${s.button} ${s.primary}`} onClick={handleEnd} disabled={busy}>
            {busy ? 'Ending…' : 'End plan'}
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}

function errorMessage(error) {
  const messages = {
    PLAN_NOT_ACTIVE: 'This plan is no longer active.',
    PLAN_NOT_FOUND: 'This plan could not be found.',
  };
  return messages[error?.code] || 'Something went wrong. Please try again.';
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
