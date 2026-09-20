import s from '../Plans.module.css';
import { styleHasMealOptions, formatCalories, formatNutrient } from '../plans.domain.js';
import WorkoutPrescriptionCard from './WorkoutPrescriptionCard.jsx';
import MealOptionCard from './MealOptionCard.jsx';
import idleBit from '../../../assets/identity/01_idle_hello/WEBP/01_idle_hello_768x1024.webp';

/**
 * PlanDay — Renders the content for a single day of the plan.
 *
 * Sections:
 * 1. Training — WorkoutPrescriptionCard per workout. Empty = rest day.
 * 2. Nutrition — MealOptionCard per meal slot (EXACT/FLEXIBLE) or macro targets (MACRO_BASED/SIMPLE_GUIDANCE).
 * 3. Guidance/Recovery — notes if present.
 *
 * @param {object} day - Plan day object with workouts, meals, guidance
 * @param {string} nutritionStyle - Plan-level nutrition style
 * @param {boolean} isToday - Whether this day is today in plan timezone
 * @param {boolean} isActive - Whether the plan is active (enables actions)
 * @param {string} scheduledDate - YYYY-MM-DD for action callbacks
 * @param {function} onStartWorkout - Callback for "Start workout"
 * @param {boolean} startingWorkout - Loading state
 */
export default function PlanDay({ day, nutritionStyle, isToday, isActive, scheduledDate, onStartWorkout, startingWorkout }) {
  if (!day) return null;

  const workouts = day.workouts || [];
  const meals = day.meals || day.mealOptions || [];
  const hasMealOptions = styleHasMealOptions(nutritionStyle);
  const showActions = isToday && isActive;

  return (
    <div className={s.dayContent}>
      {/* ── Training ─────────────────────────────────────── */}
      <div className={s.daySection}>
        <div className={s.daySectionHeader}>
          <div className={s.daySectionIcon}><TrainingIcon /></div>
          <h3>Training</h3>
        </div>

        {workouts.length > 0 ? (
          workouts.map((workout) => (
            <WorkoutPrescriptionCard
              key={workout.id}
              workout={workout}
              scheduledDate={scheduledDate}
              showStart={showActions}
              onStart={onStartWorkout}
              startLoading={startingWorkout}
            />
          ))
        ) : (
          <div className={s.restDay}>
            <img src={idleBit} alt="" className={s.bit} />
            <div>
              <h3>Rest day</h3>
              <p>Recovery is part of the plan. Let your body rebuild.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Nutrition ────────────────────────────────────── */}
      <div className={s.daySection}>
        <div className={s.daySectionHeader}>
          <div className={s.daySectionIcon}><NutritionIcon /></div>
          <h3>Nutrition</h3>
        </div>

        {hasMealOptions && meals.length > 0 ? (
          meals.map((mealSlot, slotIndex) => {
            const options = mealSlot.options || [mealSlot];
            return (
              <div key={mealSlot.id || slotIndex}>
                {options.map((option, optIndex) => (
                  <MealOptionCard
                    key={option.id || optIndex}
                    option={option}
                    isPrimary={optIndex === 0}
                    showLog={showActions && optIndex === 0}
                    scheduledDate={scheduledDate}
                    planDayId={day.id}
                  />
                ))}
              </div>
            );
          })
        ) : (
          /* MACRO_BASED / SIMPLE_GUIDANCE — show targets + guidance */
          <div className={s.macroTargets}>
            <h4>Daily nutrition targets</h4>
            {(day.calorieTarget != null || day.proteinTarget != null) && (
              <div className={s.macroGrid}>
                {day.calorieTarget != null && (
                  <div className={s.macroCell}>
                    <strong>{formatCalories(day.calorieTarget)}</strong>
                    <span>Calories</span>
                  </div>
                )}
                {day.proteinTarget != null && (
                  <div className={s.macroCell}>
                    <strong>{formatNutrient(day.proteinTarget)}</strong>
                    <span>Protein</span>
                  </div>
                )}
                {day.carbsTarget != null && (
                  <div className={s.macroCell}>
                    <strong>{formatNutrient(day.carbsTarget)}</strong>
                    <span>Carbs</span>
                  </div>
                )}
                {day.fatTarget != null && (
                  <div className={s.macroCell}>
                    <strong>{formatNutrient(day.fatTarget)}</strong>
                    <span>Fat</span>
                  </div>
                )}
              </div>
            )}
            {day.nutritionGuidance && (
              <p className={s.macroGuidance}>{day.nutritionGuidance}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Guidance / Recovery ───────────────────────────── */}
      {day.guidance && (
        <div className={s.daySection}>
          <div className={s.daySectionHeader}>
            <div className={s.daySectionIcon}><GuidanceIcon /></div>
            <h3>Notes</h3>
          </div>
          <div className={s.notice}>{day.guidance}</div>
        </div>
      )}
    </div>
  );
}

/* ── Inline icons ──────────────────────────────────────────── */

function TrainingIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 7 10 10M3 7l4-4m10 18 4-4M4 10l6-6m4 16 6-6" /></svg>;
}

function NutritionIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11h18" /><path d="M5 7l1 4" /><path d="M19 7l-1 4" /><path d="M12 4v3" /><path d="M5 11c0 5 3 8 7 8s7-3 7-8" /></svg>;
}

function GuidanceIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>;
}
