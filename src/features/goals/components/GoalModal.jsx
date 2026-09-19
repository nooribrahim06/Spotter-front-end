import { useEffect, useId, useRef } from "react";
import GoalIcon from "./GoalIcon.jsx";
import styles from "./GoalModal.module.css";

export default function GoalModal({ title, eyebrow, children, onClose, wide = false, closeLabel = "Close goal editor" }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = panelRef.current?.querySelector("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    focusable?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const items = Array.from(panelRef.current?.querySelectorAll(
          "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])"
        ) || []);
        if (!items.length) return;
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={panelRef}
        className={`${styles.modal} ${wide ? styles.wide : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <div><p>{eyebrow}</p><h2 id={titleId}>{title}</h2></div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}><GoalIcon name="close" /></button>
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
