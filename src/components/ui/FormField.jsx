import { useId } from "react";
import styles from "./FormField.module.css";

/**
 * FormField — Wraps label + input + error message with proper wiring.
 *
 * - Auto-generates id and aria-describedby
 * - Error message in a span with aria association
 * - Visible labels always (placeholders never replace labels)
 *
 * @param {string} label - Visible label text
 * @param {string} error - Error message (if any)
 * @param {React.ReactElement} children - The input element (cloned with id and aria)
 * @param {string} htmlFor - Optional explicit id override
 */
export default function FormField({
  label,
  error,
  children,
  htmlFor,
  className = "",
}) {
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      {/* Clone the child input to inject id and aria-describedby */}
      {children &&
        typeof children === "object" &&
        "props" in children
          ? (() => {
              // We need to pass props to the child input
              const { ...childProps } = children.props;
              return (
                <children.type
                  {...childProps}
                  ref={children.ref}
                  id={fieldId}
                  hasError={!!error}
                  aria-describedby={error ? errorId : undefined}
                />
              );
            })()
          : children
      }
      {error && (
        <span id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
