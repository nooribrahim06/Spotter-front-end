import styles from "./Skeleton.module.css";

/**
 * Skeleton — Placeholder loading shape.
 *
 * - Respects prefers-reduced-motion
 * - aria-hidden: purely decorative
 *
 * @param {string} width - CSS width (default: "100%")
 * @param {string} height - CSS height (default: "1rem")
 * @param {string} borderRadius - CSS border-radius override
 */
export default function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius,
  className = "",
  ...props
}) {
  return (
    <span
      className={`${styles.skeleton} ${className}`.trim()}
      aria-hidden="true"
      style={{ width, height, borderRadius }}
      {...props}
    />
  );
}
