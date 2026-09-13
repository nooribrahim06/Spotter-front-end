import { formatCalories, formatNutrient } from "../nutrition.domain.js";
import MacroChips from "./MacroChips.jsx";
import NutritionBar from "./NutritionBar.jsx";
import styles from "./DailySummary.module.css";

/**
 * DailySummary — Aggregated daily nutrition from all meals.
 *
 * Shows total calories, macro breakdown bar, and individual macro amounts.
 * If an active goal with a calorie target exists, shows progress.
 *
 * @param {{ meals: Meal[], calorieTarget?: number|null }} props
 */
import { Link } from "react-router-dom";
export default function DailySummary({ meals, targets = null, isHistorical = false }) {
  const totals = aggregateTotals(meals);
  const calorieTarget = targets?.dailyCalories;
  
  const progress = calorieTarget
    ? Math.min(Math.round((totals.calories / calorieTarget) * 100), 100)
    : null;

  const caloriesRemaining = calorieTarget ? calorieTarget - totals.calories : null;
  const isOver = caloriesRemaining !== null && caloriesRemaining < 0;

  return (
    <section className={styles.summary} aria-label="Daily nutrition summary">
      <div className={styles.calorieRow}>
        <div className={styles.calorieMain}>
          <span className={styles.calorieValue}>{formatCalories(totals.calories)}</span>
          <span className={styles.calorieLabel}>calories</span>
        </div>
        
        {calorieTarget && (
          <div className={styles.targetMain}>
            <div className={styles.target}>
              <span className={styles.targetValue}>{formatCalories(Math.abs(caloriesRemaining))}</span>
              <span className={styles.targetLabel}>{isOver ? "over" : "remaining"}</span>
            </div>
            {isHistorical && (
              <span className={styles.historicalNote}>Compared with your current targets.</span>
            )}
          </div>
        )}
      </div>

      {calorieTarget && progress != null && (
        <div className={styles.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" aria-label={`${progress}% of daily calorie target`}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}

      {targets && !calorieTarget && (
        <div className={styles.missingTargets}>
          <p>We need a bit more info to calculate your targets.</p>
          <Link to="/app/profile">Update your profile & goals</Link>
        </div>
      )}

      <NutritionBar
        proteinGrams={totals.proteinGrams}
        carbohydrateGrams={totals.carbohydrateGrams}
        fatGrams={totals.fatGrams}
        targets={targets}
      />

      <div className={styles.macroGrid}>
        <div className={styles.macroItem}>
          <span className={`${styles.macroDot} ${styles.proteinDot}`} />
          <span className={styles.macroLabel}>Protein</span>
          <span className={styles.macroValue}>
            {formatNutrient(totals.proteinGrams)}
            {targets?.proteinGrams && <span className={styles.macroTarget}> / {formatNutrient(targets.proteinGrams)}</span>}
          </span>
        </div>
        <div className={styles.macroItem}>
          <span className={`${styles.macroDot} ${styles.carbsDot}`} />
          <span className={styles.macroLabel}>Carbs</span>
          <span className={styles.macroValue}>
            {formatNutrient(totals.carbohydrateGrams)}
            {targets?.carbohydrateGrams && <span className={styles.macroTarget}> / {formatNutrient(targets.carbohydrateGrams)}</span>}
          </span>
        </div>
        <div className={styles.macroItem}>
          <span className={`${styles.macroDot} ${styles.fatDot}`} />
          <span className={styles.macroLabel}>Fat</span>
          <span className={styles.macroValue}>
            {formatNutrient(totals.fatGrams)}
            {targets?.fatGrams && <span className={styles.macroTarget}> / {formatNutrient(targets.fatGrams)}</span>}
          </span>
        </div>
      </div>

      {!totals.macrosComplete && (
        <p className={styles.incomplete}>
          Some items have unknown macros — totals may be incomplete.
        </p>
      )}
    </section>
  );
}

/**
 * Aggregate totals from an array of meals.
 * Follows the same logic as the API's MealTotals:
 * if any meal has incomplete macros, overall macros are null.
 */
function aggregateTotals(meals) {
  let calories = 0;
  let proteinGrams = 0;
  let carbohydrateGrams = 0;
  let fatGrams = 0;
  let macrosComplete = true;

  for (const meal of meals) {
    calories += meal.totals.calories;
    if (meal.totals.macrosComplete) {
      proteinGrams += meal.totals.proteinGrams;
      carbohydrateGrams += meal.totals.carbohydrateGrams;
      fatGrams += meal.totals.fatGrams;
    } else {
      macrosComplete = false;
    }
  }

  return {
    calories,
    proteinGrams: macrosComplete ? proteinGrams : null,
    carbohydrateGrams: macrosComplete ? carbohydrateGrams : null,
    fatGrams: macrosComplete ? fatGrams : null,
    macrosComplete,
  };
}
