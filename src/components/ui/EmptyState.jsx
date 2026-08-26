import styles from "./EmptyState.module.css";

/**
 * EmptyState — Empty content placeholder.
 *
 * @param {string} heading - Heading text
 * @param {string} message - Description text
 * @param {React.ReactNode} illustration - Optional illustration element
 * @param {React.ReactNode} action - Optional action button/link
 */
export default function EmptyState({
  heading,
  message,
  illustration,
  action,
  className = "",
}) {
  return (
    <div className={`${styles.emptyState} ${className}`.trim()}>
      {illustration && (
        <div className={styles.illustration}>{illustration}</div>
      )}
      {heading && <h2 className={styles.heading}>{heading}</h2>}
      {message && <p className={styles.message}>{message}</p>}
      {action}
    </div>
  );
}
