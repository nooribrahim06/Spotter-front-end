/**
 * MealTypeIcon — SVG icons for meal types.
 *
 * Renders a distinct icon for BREAKFAST, LUNCH, DINNER, and SNACK.
 * All icons are 24×24 viewBox, stroke-based, and aria-hidden.
 */

const iconPaths = {
  sunrise: (
    <>
      <circle cx="12" cy="16" r="4" />
      <path d="M12 8v-2" />
      <path d="M4.93 13.07l1.41 1.41" />
      <path d="M19.07 13.07l-1.41 1.41" />
      <path d="M3 20h18" />
      <path d="M7.34 10.34 6 9" />
      <path d="M16.66 10.34 18 9" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M5.64 5.64l1.41 1.41" />
      <path d="M16.95 16.95l1.41 1.41" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M5.64 18.36l1.41-1.41" />
      <path d="M16.95 7.05l1.41-1.41" />
    </>
  ),
  moon: (
    <>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </>
  ),
  cookie: (
    <>
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <path d="M8.5 8.5v.01" />
      <path d="M16 15.5v.01" />
      <path d="M12 12v.01" />
      <path d="M11 17v.01" />
      <path d="M7 14v.01" />
    </>
  ),
};

/**
 * @param {{ name: "sunrise"|"sun"|"moon"|"cookie", size?: number, className?: string }} props
 */
export default function MealTypeIcon({ name, size = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {iconPaths[name] || iconPaths.sun}
    </svg>
  );
}
