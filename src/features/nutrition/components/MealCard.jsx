import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mealTypeMeta, formatMealTime, formatNutrient, formatCalories } from "../nutrition.domain.js";
import MealTypeIcon from "./MealTypeIcon.jsx";
import MacroChips from "./MacroChips.jsx";
import NutritionBar from "./NutritionBar.jsx";
import styles from "./MealCard.module.css";

/**
 * MealCard — Displays a saved meal with expandable item details.
 *
 * Shows meal type icon, formatted time, item summary, and macro chips.
 * Expandable to show individual items with their quantities.
 * Edit → navigates to /app/meals/:mealId/edit
 * Delete → calls onDelete callback (parent handles confirmation dialog).
 *
 * @param {{ meal: Meal, onDelete: (mealId: string) => void }} props
 */
export default function MealCard({ meal, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const meta = mealTypeMeta(meal.mealType);
  const itemCount = meal.items.length;

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={`meal-items-${meal.id}`}
      >
        <span className={styles.typeIcon}>
          <MealTypeIcon name={meta.icon} size={18} />
        </span>

        <div className={styles.headerContent}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{meta.label}</h3>
            <time className={styles.time} dateTime={meal.occurredAt}>
              {formatMealTime(meal.occurredAt)}
            </time>
          </div>

          <p className={styles.itemSummary}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
            {meal.notes && <span className={styles.noteHint}> · has notes</span>}
          </p>

          <MacroChips
            calories={meal.totals.calories}
            proteinGrams={meal.totals.proteinGrams}
            carbohydrateGrams={meal.totals.carbohydrateGrams}
            fatGrams={meal.totals.fatGrams}
            macrosComplete={meal.totals.macrosComplete}
            size="sm"
          />

          <NutritionBar
            proteinGrams={meal.totals.proteinGrams}
            carbohydrateGrams={meal.totals.carbohydrateGrams}
            fatGrams={meal.totals.fatGrams}
          />
        </div>

        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div id={`meal-items-${meal.id}`} className={styles.body}>
          <ul className={styles.itemList}>
            {meal.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.itemBadge} data-type={item.itemType}>
                  {item.itemType === "FOOD" ? "F" : item.itemType === "RECIPE" ? "R" : "Q"}
                </span>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.itemName}</span>
                  <span className={styles.itemDetail}>
                    {item.itemType === "FOOD" && item.quantityGrams != null && `${item.quantityGrams}g`}
                    {item.itemType === "RECIPE" && item.servings != null && `${item.servings} serving${item.servings !== 1 ? "s" : ""}`}
                    {item.itemType === "QUICK" && "Quick add"}
                  </span>
                </div>
                <span className={styles.itemCal}>
                  {formatCalories(item.calories)} cal
                </span>
              </li>
            ))}
          </ul>

          {meal.notes && (
            <div className={styles.notes}>
              <span className={styles.notesLabel}>Notes</span>
              <p className={styles.notesText}>{meal.notes}</p>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => navigate(`/app/meals/${meal.id}/edit`)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Edit
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => onDelete(meal.id)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
