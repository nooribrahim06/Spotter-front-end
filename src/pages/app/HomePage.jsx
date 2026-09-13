import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { todayDateString, formatDateLabel, isToday, MEAL_TYPES, mealTypeMeta } from "../../features/nutrition/nutrition.domain.js";
import { useMealsByDate } from "../../features/nutrition/hooks/useMeals.js";
import { useProfileTargets } from "../../features/profile/hooks/useTargets.js";
import DailySummary from "../../features/nutrition/components/DailySummary.jsx";
import MealCard from "../../features/nutrition/components/MealCard.jsx";
import DeleteMealDialog from "../../features/nutrition/components/DeleteMealDialog.jsx";
import TrainingSummary from "../../features/training/components/TrainingSummary.jsx";
import WorkoutMetadataDialog from "../../features/training/components/WorkoutMetadataDialog.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import PageError from "../../components/ui/PageError.jsx";
import styles from "./HomePage.module.css";

function HomePageSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Loading your dashboard" role="status">
      <Skeleton height="48px" width="55%" borderRadius="14px" />
      <Skeleton height="180px" borderRadius="18px" />
      <Skeleton height="180px" borderRadius="18px" />
      <div className={styles.skeletonCards}>
        <Skeleton height="120px" borderRadius="16px" />
        <Skeleton height="120px" borderRadius="16px" />
        <Skeleton height="120px" borderRadius="16px" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const today = todayDateString();
  const selectedDate = dateParam || today;
  const isSelectedToday = isToday(selectedDate);
  
  const [deletingMeal, setDeletingMeal] = useState(null);
  const [startWorkout, setStartWorkout] = useState(false);

  // Set up date boundaries
  const selectedDateTime = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);

  const goToPreviousDay = () => {
    const prev = new Date(selectedDateTime);
    prev.setDate(prev.getDate() - 1);
    setSearchParams({ date: prev.toISOString().slice(0, 10) });
  };

  const goToNextDay = () => {
    const next = new Date(selectedDateTime);
    next.setDate(next.getDate() + 1);
    const nextDateStr = next.toISOString().slice(0, 10);
    // Don't allow future dates
    if (nextDateStr > today) return;
    
    if (nextDateStr === today) {
      setSearchParams({});
    } else {
      setSearchParams({ date: nextDateStr });
    }
  };

  const goToToday = () => {
    setSearchParams({});
  };

  const isFuture = (dateStr) => {
    return dateStr > today;
  };

  // Queries
  const mealsQuery = useMealsByDate(selectedDate);
  const targetsQuery = useProfileTargets();

  useEffect(() => {
    document.title = isSelectedToday ? "Today — Spotter" : `${formatDateLabel(selectedDate, { short: true })} — Spotter`;
  }, [isSelectedToday, selectedDate]);

  const meals = mealsQuery.data?.items || [];
  const groupedMeals = groupMealsByType(meals);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.heading}>{isSelectedToday ? "Today" : formatDateLabel(selectedDate, { short: true })}</h1>
          {!isSelectedToday && (
            <time className={styles.date} dateTime={selectedDate}>
              {formatDateLabel(selectedDate)}
            </time>
          )}
        </div>
        
        <div className={styles.dateControls}>
          <button 
            type="button" 
            className={styles.dateButton} 
            onClick={goToPreviousDay}
            aria-label="Previous day"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          {!isSelectedToday && (
            <button 
              type="button" 
              className={styles.todayButton} 
              onClick={goToToday}
            >
              Today
            </button>
          )}
          
          <button 
            type="button" 
            className={styles.dateButton} 
            onClick={goToNextDay}
            disabled={isFuture(new Date(selectedDateTime.getTime() + 86400000).toISOString().slice(0, 10))}
            aria-label="Next day"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </header>

      {/* Nutrition Section */}
      {mealsQuery.isLoading || targetsQuery.isLoading ? (
        <HomePageSkeleton />
      ) : (
        <>
          {mealsQuery.isError && (
            <PageError
              title="Couldn't load your meals"
              message="We had trouble fetching this date's data. Please try again."
              onRetry={mealsQuery.refetch}
            />
          )}

          {!mealsQuery.isError && (
            <DailySummary 
              meals={meals} 
              targets={targetsQuery.data} 
              isHistorical={!isSelectedToday} 
            />
          )}
        </>
      )}

      {/* Training Section */}
      <TrainingSummary 
        date={selectedDate} 
        isToday={isSelectedToday} 
        onStartWorkout={() => setStartWorkout(true)} 
      />

      {/* Meal Groups */}
      {!mealsQuery.isLoading && !mealsQuery.isError && meals.length === 0 ? (
        <EmptyState
          heading="No meals yet"
          message="Start tracking your nutrition by logging your first meal."
          action={
            <Link to="/app/meals/new" className={styles.emptyAction}>
              Log your first meal
            </Link>
          }
        />
      ) : (
        <div className={styles.mealGroups}>
          {MEAL_TYPES.map((type) => {
            const typeMeals = groupedMeals[type];
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

      {isSelectedToday && (
        <Link to="/app/meals/new" className={styles.fab} aria-label="Log a meal">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          <span>Log Meal</span>
        </Link>
      )}

      <DeleteMealDialog
        meal={deletingMeal}
        open={!!deletingMeal}
        onClose={() => setDeletingMeal(null)}
      />

      {startWorkout && <WorkoutMetadataDialog onClose={() => setStartWorkout(false)} />}
    </div>
  );
}

/**
 * Group meals by their meal type.
 */
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
