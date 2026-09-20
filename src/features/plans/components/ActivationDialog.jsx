import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import s from '../Plans.module.css';
import { useActivatePlan, useActivePlan } from '../usePlans.js';
import { planTitle } from '../plans.domain.js';

/**
 * ActivationDialog — Confirms plan activation.
 *
 * Two variants:
 * 1. No active plan: "Activate this plan?" → sends expectedActivePlanId: null
 * 2. With replacement: warns that current plan will be replaced, sends its ID
 *
 * On PLAN_ACTIVE_CHANGED: refreshes active plan, asks user to decide again (never auto-resubmits).
 */
export default function ActivationDialog({ plan, onClose, onSuccess }) {
  const ref = useRef(null);
  const titleId = useId();
  const activePlan = useActivePlan();
  const activate = useActivatePlan();

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.showModal();
    return () => { ref.current?.close(); document.body.style.overflow = previousOverflow; previous?.focus?.(); };
  }, []);

  const hasActivePlan = activePlan.data && activePlan.data.id !== plan.id;
  const busy = activate.isPending;

  function handleActivate() {
    activate.mutate(
      { planId: plan.id, expectedActivePlanId: hasActivePlan ? activePlan.data.id : null },
      {
        onSuccess: () => { onSuccess?.(); onClose(); },
        onError: (error) => {
          // On concurrency conflict, refresh active plan and let user decide again
          if (error.code === 'PLAN_ACTIVE_CHANGED') activePlan.refetch();
        },
      }
    );
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
          <h2 id={titleId}>Activate this plan?</h2>
        </div>
        <button type="button" className={`${s.button} ${s.iconButton}`} aria-label="Close dialog" onClick={onClose} disabled={busy}>
          <CloseIcon />
        </button>
      </header>
      <div className={s.dialogBody}>
        <div className={s.confirmContent}>
          {hasActivePlan ? (
            <p>
              Activating <strong>{planTitle(plan)}</strong> will replace{' '}
              <strong>{planTitle(activePlan.data)}</strong>. Your previous plan and activity
              history will remain available.
            </p>
          ) : (
            <p>
              <strong>{planTitle(plan)}</strong> will become your active plan.
              Your daily training and nutrition will follow this schedule.
            </p>
          )}

          {activate.isError && activate.error?.code !== 'PLAN_ACTIVE_CHANGED' && (
            <div className={s.error} role="alert">
              <p>{errorMessage(activate.error)}</p>
            </div>
          )}

          {activate.isError && activate.error?.code === 'PLAN_ACTIVE_CHANGED' && (
            <div className={s.notice} role="alert">
              <p>The active plan changed. Please review and try again.</p>
            </div>
          )}
        </div>

        <div className={s.dialogActions}>
          <button type="button" className={`${s.button} ${s.secondary}`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`${s.button} ${s.primary}`} onClick={handleActivate} disabled={busy}>
            {busy ? 'Activating…' : hasActivePlan ? 'Replace & activate' : 'Activate'}
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}

function errorMessage(error) {
  const messages = {
    PLAN_NOT_DRAFT: 'This plan is no longer a draft.',
    PLAN_NOT_FOUND: 'This plan could not be found.',
    PLAN_NOT_STARTED: "This plan hasn't started yet.",
    PLAN_EXPIRED: "This plan's coverage has ended.",
  };
  return messages[error?.code] || 'Something went wrong. Please try again.';
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
