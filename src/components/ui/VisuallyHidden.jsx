/**
 * VisuallyHidden — Screen-reader-only text.
 *
 * Uses the standard SR-only CSS pattern (clip/position).
 * Content is hidden visually but accessible to assistive technology.
 *
 * @param {string} as - HTML element type (default: "span")
 */
export default function VisuallyHidden({
  as: Element = "span",
  children,
  ...props
}) {
  return (
    <Element className="visually-hidden" {...props}>
      {children}
    </Element>
  );
}
