import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import s from '../Plans.module.css';
import { useDiscardPlan } from '../usePlans.js';
import { planTitle } from '../plans.domain.js';

/**
 * DiscardDialog — Confirms discarding a draft plan.
 *
 * Discarding removes the draft permanently. It does not affect
 * the active plan or any logged activity.
 */
export default function DiscardDialog({ plan, onClose, onSuccess }) {
  const ref = useRef(null);
  const titleId = useId();
  const discard = useDiscardPlan();

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.showModal();
    return () => { ref.current?.close(); document.body.style.overflow = previousOverflow; previous?.focus?.(); };
  }, []);

  const busy = discard.isPending;

  function handleDiscard() {
    discard.mutate(plan.id, {
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
          <h2 id={titleId}>Discard this draft?</h2>
        </div>
        <button type="button" className={`${s.button} ${s.iconButton}`} aria-label="Close dialog" onClick={onClose} disabled={busy}>
          <CloseIcon />
        </button>
      </header>
      <div className={s.dialogBody}>
        <div className={s.confirmContent}>
          <p>
            <strong>{planTitle(plan)}</strong> will be permanently discarded.
            This won't affect your active plan or any logged activity.
          </p>

          {discard.isError && (
            <div className={s.error} role="alert">
              <p>{errorMessage(discard.error)}</p>
            </div>
          )}
        </div>

        <div className={s.dialogActions}>
          <button type="button" className={`${s.button} ${s.secondary}`} onClick={onClose} disabled={busy}>
            Keep draft
          </button>
          <button type="button" className={`${s.button} ${s.primary}`} onClick={handleDiscard} disabled={busy}>
            {busy ? 'Discarding…' : 'Discard'}
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
  };
  return messages[error?.code] || 'Something went wrong. Please try again.';
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
