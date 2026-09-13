import { useState } from "react";
import { calculateRecipePreview } from "../nutrition.domain.js";
import MacroChips from "./MacroChips.jsx";
import NutritionBar from "./NutritionBar.jsx";
import styles from "./RecipeServingsEntry.module.css";

/**
 * Servings entry screen for a selected recipe.
 * Displays preview calculations and lets the user input number of servings.
 */
export default function RecipeServingsEntry({ recipe, onConfirm, onCancel }) {
  const [servings, setServings] = useState(1);

  const preview = calculateRecipePreview(recipe, Number(servings) || 0);
  const isValid = Number(servings) > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(Number(servings));
    }
  };

  const adjustServings = (amount) => {
    setServings((prev) => Math.max(0.25, Math.round(((Number(prev) || 0) + amount) * 100) / 100));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onCancel}
          aria-label="Back to recipe search"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.titleArea}>
          <h3 className={styles.recipeName}>{recipe.nameEn}</h3>
          <span className={styles.subtext}>
            Yields {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
            {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
          </span>
        </div>
      </div>

      <div className={styles.previewBox}>
        <span className={styles.previewLabel}>Calculated Nutrition</span>
        <MacroChips
          calories={preview.calories}
          proteinGrams={preview.proteinGrams}
          carbohydrateGrams={preview.carbohydrateGrams}
          fatGrams={preview.fatGrams}
          size="md"
        />
        <NutritionBar
          proteinGrams={preview.proteinGrams}
          carbohydrateGrams={preview.carbohydrateGrams}
          fatGrams={preview.fatGrams}
        />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="recipe-servings-input" className={styles.inputLabel}>
            Number of Servings
          </label>
          <div className={styles.inputRow}>
            <input
              id="recipe-servings-input"
              type="number"
              min="0.1"
              max="50"
              step="0.25"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className={styles.servingsInput}
              autoFocus
            />
            <span className={styles.unitBadge}>serving(s)</span>
          </div>

          <div className={styles.quickChips}>
            <button type="button" onClick={() => adjustServings(-0.5)} className={styles.chipBtn}>-0.5</button>
            <button type="button" onClick={() => setServings(0.5)} className={styles.chipBtn}>0.5</button>
            <button type="button" onClick={() => setServings(1)} className={styles.chipBtn}>1.0</button>
            <button type="button" onClick={() => setServings(1.5)} className={styles.chipBtn}>1.5</button>
            <button type="button" onClick={() => setServings(2)} className={styles.chipBtn}>2.0</button>
            <button type="button" onClick={() => adjustServings(0.5)} className={styles.chipBtn}>+0.5</button>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={!isValid} className={styles.addBtn}>
            Add to Meal
          </button>
        </div>
      </form>
    </div>
  );
}
