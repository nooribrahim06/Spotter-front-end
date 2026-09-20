import { Link } from 'react-router-dom';
import s from '../Plans.module.css';
import { formatCalories, formatNutrient } from '../plans.domain.js';

/**
 * MealOptionCard — Displays a planned meal option.
 *
 * For EXACT_MEALS: shows primary option prominently, alternatives labeled separately.
 * For FLEXIBLE_MEALS: alternatives shown as alternatives.
 * Never sums alternatives as if the user eats all of them.
 * Nutrition snapshot is optional — never fabricates zeros.
 *
 * @param {object} option - Meal option from the plan
 * @param {boolean} [isPrimary] - Whether this is the primary (vs alternative) option
 * @param {boolean} [showLog] - Whether to show "Log this meal" action
 * @param {string} [scheduledDate] - YYYY-MM-DD for routing state
 * @param {string} [planDayId] - Plan day ID for routing state
 */
export default function MealOptionCard({ option, isPrimary = true, showLog, scheduledDate, planDayId }) {
  if (!option) return null;

  const hasNutrition = option.calories != null || option.proteinGrams != null;

  return (
    <div className={s.mealCard}>
      {!isPrimary && <p className={s.alternativeLabel}>Alternative</p>}

      <div className={s.mealHeader}>
        <h4>{option.label || option.name || 'Meal'}</h4>
        {option.slot && <span className={s.mealSlot}>{option.slot}</span>}
      </div>

      {option.items?.length > 0 && (
        <ul className={s.mealItems}>
          {option.items.map((item, index) => (
            <li key={item.id || index} className={s.mealItem}>
              <span>{item.name || item.description}</span>
              {item.quantity && <span className={s.muted} style={{ fontSize: '.76rem' }}>{item.quantity}</span>}
            </li>
          ))}
        </ul>
      )}

      {hasNutrition && (
        <div className={s.mealNutrition}>
          {option.calories != null && (
            <div className={s.nutrient}>
              <strong>{formatCalories(option.calories)}</strong>
              <span>Calories</span>
            </div>
          )}
          {option.proteinGrams != null && (
            <div className={s.nutrient}>
              <strong>{formatNutrient(option.proteinGrams)}</strong>
              <span>Protein</span>
            </div>
          )}
          {option.carbsGrams != null && (
            <div className={s.nutrient}>
              <strong>{formatNutrient(option.carbsGrams)}</strong>
              <span>Carbs</span>
            </div>
          )}
          {option.fatGrams != null && (
            <div className={s.nutrient}>
              <strong>{formatNutrient(option.fatGrams)}</strong>
              <span>Fat</span>
            </div>
          )}
        </div>
      )}

      {option.note && <p className={s.mealNote}>{option.note}</p>}

      {showLog && (
        <div className={s.mealActions}>
          <Link
            to="/app/meals/new"
            state={{
              fromPlan: true,
              planDayId,
              optionId: option.id,
              scheduledDate,
              prefill: option,
            }}
            className={`${s.button} ${s.secondary}`}
          >
            Log this meal
          </Link>
        </div>
      )}
    </div>
  );
}
