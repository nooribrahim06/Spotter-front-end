import { formatCalories, formatNutrient } from "../nutrition.domain.js";
import styles from "./MacroChips.module.css";

/**
 * MacroChips — Compact inline nutrition display.
 *
 * Shows: 🔥 320 cal · P 28g · C 12g · F 18g
 * Displays "—" for null values (never shows null as zero).
 *
 * @param {{ calories: number|null, proteinGrams: number|null, carbohydrateGrams: number|null, fatGrams: number|null, macrosComplete?: boolean, size?: "sm"|"md" }} props
 */
export default function MacroChips({
  calories,
  proteinGrams,
  carbohydrateGrams,
  fatGrams,
  macrosComplete = true,
  size = "md",
}) {
  return (
    <div className={`${styles.chips} ${styles[size]}`}>
      <span className={styles.calorie} aria-label="Calories">
        <span className={styles.icon} aria-hidden="true">🔥</span>
        <span>{formatCalories(calories)}</span>
        <span className={styles.unit}>cal</span>
      </span>
      <span className={styles.sep} aria-hidden="true">·</span>
      <span className={`${styles.macro} ${styles.protein}`} aria-label="Protein">
        <span className={styles.label}>P</span>
        <span>{formatNutrient(proteinGrams)}</span>
      </span>
      <span className={styles.sep} aria-hidden="true">·</span>
      <span className={`${styles.macro} ${styles.carbs}`} aria-label="Carbohydrates">
        <span className={styles.label}>C</span>
        <span>{formatNutrient(carbohydrateGrams)}</span>
      </span>
      <span className={styles.sep} aria-hidden="true">·</span>
      <span className={`${styles.macro} ${styles.fat}`} aria-label="Fat">
        <span className={styles.label}>F</span>
        <span>{formatNutrient(fatGrams)}</span>
      </span>
      {!macrosComplete && (
        <span className={styles.incomplete} title="Some macros are unknown">
          Incomplete
        </span>
      )}
    </div>
  );
}
