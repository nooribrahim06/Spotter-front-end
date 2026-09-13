import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { todayDateString, formatDateLabel, isToday, MEAL_TYPES, mealTypeMeta } from "../../features/nutrition/nutrition.domain.js";
import { useMealsByDate } from "../../features/nutrition/hooks/useMeals.js";
import DailySummary from "../../features/nutrition/components/DailySummary.jsx";
import MealCard from "../../features/nutrition/components/MealCard.jsx";
import DeleteMealDialog from "../../features/nutrition/components/DeleteMealDialog.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import PageError from "../../components/ui/PageError.jsx";
import styles from "./MealsPage.module.css";

function MealsSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Loading meals" role="status">
      <Skeleton height="42px" width="200px" borderRadius="10px" />
      <Skeleton height="160px" borderRadius="18px" />
      <Skeleton height="110px" borderRadius="16px" />
      <Skeleton height="110px" borderRadius="16px" />
    </div>
  );
}

/**
 * MealsPage — Browse meals by date.
 *
 * Date selector (native input) to navigate between days.
 * Shows the same meal list + summary as home, for any selected date.
 */
export default function MealsPage() {
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const { data, isLoading, isError, refetch } = useMealsByDate(selectedDate);
  const [deletingMeal, setDeletingMeal] = useState(null);

  useEffect(() => {
    document.title = "Meals — Spotter";
  }, []);

  const meals = data?.items || [];
  const grouped = groupMealsByType(meals);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.heading}>Meals</h1>
          <span className={styles.dateLabel}>
            {isToday(selectedDate) ? "Today" : formatDateLabel(selectedDate)}
          </span>
        </div>

        <div className={styles.datePicker}>
          <button
            type="button"
            className={styles.dateNav}
            aria-label="Previous day"
            onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            max={todayDateString()}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="Select date"
          />

          <button
            type="button"
            className={styles.dateNav}
            aria-label="Next day"
            disabled={isToday(selectedDate)}
            onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </header>

      {isLoading ? (
        <MealsSkeleton />
      ) : isError ? (
        <PageError
          title="Couldn't load meals"
          message="We had trouble fetching meals for this date."
          onRetry={refetch}
        />
      ) : (
        <>
          <DailySummary meals={meals} />

          {meals.length === 0 ? (
            <EmptyState
              heading="No meals logged"
              message={
                isToday(selectedDate)
                  ? "Start tracking by logging your first meal today."
                  : `No meals were logged on ${formatDateLabel(selectedDate, { short: true })}.`
              }
              action={
                isToday(selectedDate) ? (
                  <Link to="/app/meals/new" className={styles.emptyAction}>
                    Log a meal
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className={styles.mealGroups}>
              {MEAL_TYPES.map((type) => {
                const typeMeals = grouped[type];
                if (!typeMeals || typeMeals.length === 0) return null;
                const meta = mealTypeMeta(type);
                return (
                  <section key={type} className={styles.mealGroup}>
                    <h2 className={styles.groupTitle}>{meta.label}</h2>
                    <div className={styles.groupCards}>
                      {typeMeals.map((meal) => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                          onDelete={(id) => setDeletingMeal(meals.find((m) => m.id === id))}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <DeleteMealDialog
        meal={deletingMeal}
        open={!!deletingMeal}
        onClose={() => setDeletingMeal(null)}
      />
    </div>
  );
}

function groupMealsByType(meals) {
  const groups = {};
  for (const type of MEAL_TYPES) {
    groups[type] = [];
  }
  for (const meal of meals) {
    if (groups[meal.mealType]) {
      groups[meal.mealType].push(meal);
    }
  }
  return groups;
}

/**
 * Shift a YYYY-MM-DD date string by N days.
 */
function shiftDate(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`); // Noon to avoid DST issues
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
