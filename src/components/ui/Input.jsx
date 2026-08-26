import { forwardRef } from "react";
import styles from "./Input.module.css";

/**
 * Input — Accessible input primitive.
 *
 * - Renders <input> with forwarded ref
 * - Error state via hasError prop
 * - Never replaces label (labels are in FormField)
 * - Supports aria-describedby for error association
 */
const Input = forwardRef(function Input(
  { hasError = false, className = "", type = "text", ...props },
  ref
) {
  const classNames = [
    styles.input,
    hasError ? styles.inputError : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      ref={ref}
      type={type}
      className={classNames}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
});

export default Input;
