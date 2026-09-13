import { useState } from "react";
import { calculateFoodPreview } from "../nutrition.domain.js";
import MacroChips from "./MacroChips.jsx";
import NutritionBar from "./NutritionBar.jsx";
import styles from "./FoodQuantityEntry.module.css";

/**
 * Quantity entry screen for a selected food.
 * Displays preview calculations and lets the user input grams.
 */
export default function FoodQuantityEntry({ food, onConfirm, onCancel }) {
  const [grams, setGrams] = useState(100);

  const preview = calculateFoodPreview(food, Number(grams) || 0);

  const isValid = Number(grams) > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(Number(grams));
    }
  };

  const adjustGrams = (amount) => {
    setGrams((prev) => Math.max(10, (Number(prev) || 0) + amount));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onCancel}
          aria-label="Back to food search"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.titleArea}>
          <h3 className={styles.foodName}>{food.nameEn}</h3>
          {food.category && <span className={styles.category}>{food.category}</span>}
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
          <label htmlFor="food-quantity-input" className={styles.inputLabel}>
            Serving Size (grams)
          </label>
          <div className={styles.inputRow}>
            <input
              id="food-quantity-input"
              type="number"
              min="1"
              max="5000"
              step="1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className={styles.quantityInput}
              autoFocus
            />
            <span className={styles.unitBadge}>g</span>
          </div>

          <div className={styles.quickChips}>
            <button type="button" onClick={() => adjustGrams(-25)} className={styles.chipBtn}>-25g</button>
            <button type="button" onClick={() => setGrams(50)} className={styles.chipBtn}>50g</button>
            <button type="button" onClick={() => setGrams(100)} className={styles.chipBtn}>100g</button>
            <button type="button" onClick={() => setGrams(150)} className={styles.chipBtn}>150g</button>
            <button type="button" onClick={() => setGrams(200)} className={styles.chipBtn}>200g</button>
            <button type="button" onClick={() => adjustGrams(25)} className={styles.chipBtn}>+25g</button>
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
