import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMealDetail } from "../../features/nutrition/hooks/useMeals.js";
import { useMealDraftStore } from "../../stores/mealDraftStore.js";
import MealDraftPanel from "../../features/nutrition/components/MealDraftPanel.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import PageError from "../../components/ui/PageError.jsx";
import styles from "./MealPage.module.css";

/**
 * Full page for logging a new meal or editing an existing meal.
 */
export default function MealPage() {
  const { mealId } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(mealId);

  const {
    editingMealId,
    mealType,
    initDraft,
    initFromMeal,
    clearDraft,
  } = useMealDraftStore();

  const { data: meal, isLoading, isError, error, refetch } = useMealDetail(mealId);

  // Set document title
  useEffect(() => {
    document.title = isEdit ? "Edit Meal — Spotter" : "Log Meal — Spotter";
  }, [isEdit]);

  // If editing, load server meal into draft store when available
  useEffect(() => {
    if (isEdit && meal && editingMealId !== meal.id) {
      initFromMeal(meal);
    }
  }, [isEdit, meal, editingMealId, initFromMeal]);

  // If new meal and no mealType is set, initialize with reasonable default based on current hour
  useEffect(() => {
    if (!isEdit && !mealType) {
      const hour = new Date().getHours();
      let defaultType = "LUNCH";
      if (hour < 11) defaultType = "BREAKFAST";
      else if (hour < 16) defaultType = "LUNCH";
      else if (hour < 21) defaultType = "DINNER";
      else defaultType = "SNACK";

      initDraft(defaultType);
    }
  }, [isEdit, mealType, initDraft]);

  const handleCancel = () => {
    clearDraft();
    navigate(-1);
  };

  const handleSaved = () => {
    navigate("/app/home");
  };

  if (isEdit && isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton height="36px" width="220px" borderRadius="8px" />
        </div>
        <div className={styles.skeletonBody}>
          <Skeleton height="80px" borderRadius="12px" />
          <Skeleton height="60px" borderRadius="12px" />
          <Skeleton height="150px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  if (isEdit && isError) {
    return (
      <div className={styles.page}>
        <PageError
          title="Could not load meal"
          message="We couldn't find this meal or you may not have permission to view it."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.backBtn}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className={styles.heading}>
            {isEdit ? "Edit Meal" : "Log a Meal"}
          </h1>
          <p className={styles.subtitle}>
            {isEdit
              ? "Updating will replace all items with fresh nutrition snapshots."
              : "Track your food, recipes, and macros for today."}
          </p>
        </div>
      </header>

      <main className={styles.content}>
        <MealDraftPanel
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
}
