import styles from "./Spinner.module.css";

/**
 * Spinner — Accessible loading indicator.
 *
 * - role="status" for screen readers
 * - Visually hidden "Loading…" text
 * - Respects prefers-reduced-motion
 *
 * @param {"sm"|"md"|"lg"} size
 * @param {string} label - Screen-reader label (default: "Loading…")
 */
export default function Spinner({ size = "md", label = "Loading…" }) {
  const sizeClass = size !== "md" ? styles[`spinner--${size}`] : "";
  const className = `${styles.spinner} ${sizeClass}`.trim();

  return (
    <span className={className} role="status">
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
