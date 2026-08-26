import styles from "./Card.module.css";

/**
 * Card — Simple container primitive.
 *
 * @param {string} as - HTML element type (default: "div")
 * @param {string} className - Additional CSS classes
 */
export default function Card({
  as: Element = "div",
  children,
  className = "",
  ...props
}) {
  return (
    <Element className={`${styles.card} ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}
