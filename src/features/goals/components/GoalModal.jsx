import { useEffect, useRef } from "react";
import GoalIcon from "./GoalIcon.jsx";
import styles from "./GoalModal.module.css";

export default function GoalModal({ title, eyebrow, children, onClose, wide = false }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const focusable = panelRef.current?.querySelector("button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    focusable?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const items = Array.from(panelRef.current?.querySelectorAll(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])"
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
        aria-labelledby="goal-modal-title"
      >
        <header className={styles.header}>
          <div><p>{eyebrow}</p><h2 id="goal-modal-title">{title}</h2></div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close goal editor"><GoalIcon name="close" /></button>
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
