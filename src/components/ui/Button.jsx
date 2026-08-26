import { forwardRef } from "react";
import Spinner from "./Spinner.jsx";
import styles from "./Button.module.css";

/**
 * Button — Accessible button primitive.
 *
 * - Always renders <button> (never <a>)
 * - isLoading: shows spinner, sets aria-busy, disables interaction
 * - Minimum 44×44px touch target
 * - Keyboard accessible by default (native <button>)
 *
 * @param {"primary"|"secondary"|"danger"|"ghost"} variant
 * @param {"sm"|"md"|"lg"} size
 * @param {boolean} isLoading
 * @param {boolean} fullWidth
 */
const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    type = "button",
    isLoading = false,
    disabled = false,
    fullWidth = false,
    children,
    className = "",
    ...props
  },
  ref
) {
  const classNames = [
    styles.button,
    styles[variant],
    size !== "md" ? styles[size] : "",
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type={type}
      className={classNames}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" label="Submitting…" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
