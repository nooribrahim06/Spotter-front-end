import styles from "./InlineError.module.css";

/**
 * InlineError — Field-level error message.
 *
 * - role="alert" for screen reader announcement
 * - Designed to be associated with a field via aria-describedby
 *
 * @param {string} message - Error text
 * @param {string} id - For aria-describedby association
 */
export default function InlineError({ message, id, className = "" }) {
  if (!message) return null;

  return (
    <span
      id={id}
      className={`${styles.inlineError} ${className}`.trim()}
      role="alert"
    >
      {message}
    </span>
  );
}
