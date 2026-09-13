import styles from "./NutritionBar.module.css";

/**
 * NutritionBar — Horizontal stacked bar showing protein / carbs / fat distribution.
 *
 * Shows proportional widths with distinct colors.
 * Renders nothing meaningful when all macros are null.
 *
 * @param {{ proteinGrams: number|null, carbohydrateGrams: number|null, fatGrams: number|null }} props
 */
export default function NutritionBar({
  proteinGrams,
  carbohydrateGrams,
  fatGrams,
  className = "",
}) {
  const p = proteinGrams || 0;
  const c = carbohydrateGrams || 0;
  const f = fatGrams || 0;
  const total = p + c + f;

  if (total === 0) {
    return (
      <div
        className={`${styles.bar} ${styles.empty} ${className}`.trim()}
        role="img"
        aria-label="No macro data"
      >
        <div className={styles.emptyFill} />
      </div>
    );
  }

  const pPct = (p / total) * 100;
  const cPct = (c / total) * 100;
  const fPct = (f / total) * 100;

  return (
    <div
      className={`${styles.bar} ${className}`.trim()}
      role="img"
      aria-label={`Protein ${Math.round(pPct)}%, Carbs ${Math.round(cPct)}%, Fat ${Math.round(fPct)}%`}
    >
      {pPct > 0 && (
        <div
          className={`${styles.segment} ${styles.protein}`}
          style={{ width: `${pPct}%` }}
          title={`Protein ${Math.round(pPct)}%`}
        />
      )}
      {cPct > 0 && (
        <div
          className={`${styles.segment} ${styles.carbs}`}
          style={{ width: `${cPct}%` }}
          title={`Carbs ${Math.round(cPct)}%`}
        />
      )}
      {fPct > 0 && (
        <div
          className={`${styles.segment} ${styles.fat}`}
          style={{ width: `${fPct}%` }}
          title={`Fat ${Math.round(fPct)}%`}
        />
      )}
    </div>
  );
}
