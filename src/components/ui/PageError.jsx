import Button from "./Button.jsx";
import styles from "./PageError.module.css";

/**
 * PageError — Full-page error state.
 *
 * Used for initialization failures and unexpected errors.
 *
 * @param {string} title - Error heading
 * @param {string} message - Error description
 * @param {Function} onRetry - Retry callback
 * @param {string} retryLabel - Retry button text
 */
export default function PageError({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryLabel = "Try again",
}) {
  return (
    <div className={styles.pageError} role="alert">
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
