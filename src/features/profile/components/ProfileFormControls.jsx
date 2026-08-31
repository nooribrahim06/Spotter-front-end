import { Children, cloneElement, useEffect, useId, useRef, useState } from "react";
import Button from "../../../components/ui/Button.jsx";
import { humanize, normalizeCode } from "../profile.utils.js";
import styles from "./ProfileForm.module.css";

export function EditorShell({
  eyebrow,
  title,
  description,
  onClose,
  onSubmit,
  isSaving,
  serverError,
  submitLabel = "Save changes",
  children,
  footer,
}) {
  const errorRef = useRef(null);

  useEffect(() => {
    if (serverError) errorRef.current?.focus();
  }, [serverError]);

  return (
    <section className={styles.editor} aria-labelledby="profile-editor-title">
      <header className={styles.editorHeader}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 id="profile-editor-title">{title}</h2>
          <p className={styles.editorDescription}>{description}</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close editor">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      {serverError && (
        <div ref={errorRef} className={styles.errorSummary} role="alert" tabIndex="-1">
          <strong>We couldn’t save this yet.</strong>
          <span>{serverError.message}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.formBody}>{children}</div>
        <footer className={styles.formFooter}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isSaving}>
            {submitLabel}
          </Button>
        </footer>
      </form>
      {footer}
    </section>
  );
}

export function Field({ label, hint, error, children, className = "" }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const child = Children.only(children);

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {hint && <span id={hintId} className={styles.hint}>{hint}</span>}
      {cloneElement(child, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error && <span id={errorId} className={styles.fieldError}>{error}</span>}
    </div>
  );
}

export function TextInput(props) {
  return <input className={styles.control} {...props} />;
}

export function SelectInput({ children, ...props }) {
  return <select className={styles.control} {...props}>{children}</select>;
}

export function Textarea(props) {
  return <textarea className={`${styles.control} ${styles.textarea}`} {...props} />;
}

export function OptionList({ values, includeUnset = false, unsetLabel = "Not set" }) {
  return (
    <>
      {includeUnset && <option value="">{unsetLabel}</option>}
      {values.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
    </>
  );
}

export function Toggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className={styles.toggleRow}>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <span className={styles.toggle} aria-hidden="true"><span /></span>
    </label>
  );
}

export function ChoiceGrid({ legend, value, values, onChange, descriptions = {} }) {
  return (
    <fieldset className={styles.choiceFieldset}>
      <legend>{legend}</legend>
      <div className={styles.choiceGrid}>
        {values.map((option) => (
          <label key={option} className={styles.choiceCard}>
            <input
              type="radio"
              name={legend}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>
              <strong>{humanize(option)}</strong>
              {descriptions[option] && <small>{descriptions[option]}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TagInput({ label, hint, values, onChange, placeholder = "Add an item" }) {
  const [draft, setDraft] = useState("");
  const id = useId();

  const add = () => {
    const next = normalizeCode(draft);
    if (!next || values.includes(next)) return;
    onChange([...values, next]);
    setDraft("");
  };

  return (
    <div className={styles.tagField}>
      <label htmlFor={id}>{label}</label>
      {hint && <span className={styles.hint}>{hint}</span>}
      {values.length > 0 && (
        <div className={styles.tags} aria-label={`${label} added`}>
          {values.map((item) => (
            <span className={styles.tag} key={item}>
              {humanize(item)}
              <button type="button" onClick={() => onChange(values.filter((value) => value !== item))} aria-label={`Remove ${humanize(item)}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.tagComposer}>
        <input
          id={id}
          className={styles.control}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add} disabled={!draft.trim()}>Add</Button>
      </div>
    </div>
  );
}

export function StepHeader({ step, total, title, description }) {
  return (
    <div className={styles.stepHeader}>
      <span>Step {step} of {total}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className={styles.stepDots} aria-hidden="true">
        {Array.from({ length: total }, (_, index) => <i key={index} data-active={index < step} />)}
      </div>
    </div>
  );
}

export function StepActions({ step, total, setStep }) {
  return (
    <div className={styles.stepActions}>
      {step > 1 && <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
      {step < total && <Button type="button" variant="secondary" onClick={() => setStep(step + 1)}>Continue</Button>}
    </div>
  );
}

