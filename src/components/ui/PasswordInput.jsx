import { forwardRef, useState } from "react";
import Input from "./Input.jsx";
import styles from "./PasswordInput.module.css";

/**
 * PasswordInput — Extends Input with show/hide toggle.
 *
 * - Toggle button has accessible name ("Show password" / "Hide password")
 * - type toggles between "password" and "text"
 * - Toggle button has 44×44px minimum touch target
 */
const PasswordInput = forwardRef(function PasswordInput(
  { className = "", ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrapper}>
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={`${styles.passwordInput} ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
});

export default PasswordInput;
