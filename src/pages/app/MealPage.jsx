import { useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMealDetail } from "../../features/nutrition/hooks/useMeals.js";
import { useMealDraftStore } from "../../stores/mealDraftStore.js";
import MealDraftPanel from "../../features/nutrition/components/MealDraftPanel.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import PageError from "../../components/ui/PageError.jsx";
import styles from "./MealPage.module.css";

/**
 * Full page for logging a new meal or editing an existing meal.
 * Handles pre-filling from plan context when navigated from a planned meal option.
 */
export default function MealPage() {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = Boolean(mealId);
  const fromPlanState = location.state?.fromPlan ? location.state : null;
  const initializedFromPlanRef = useRef(false);

  const {
    editingMealId,
    mealType,
    initDraft,
    initFromMeal,
    setNotes,
    addQuickItem,
    clearDraft,
  } = useMealDraftStore();

  const { data: meal, isLoading, isError, refetch } = useMealDetail(mealId);

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

  // Pre-fill from plan state if navigated from a plan day
  useEffect(() => {
    if (!isEdit && fromPlanState && !initializedFromPlanRef.current) {
      initializedFromPlanRef.current = true;
      const { prefill, scheduledDate } = fromPlanState;

      // Determine mealType from slot or label
      let selectedType = "LUNCH";
      const slot = (prefill?.slot || "").toUpperCase();
      const label = (prefill?.label || prefill?.name || "").toLowerCase();
      if (slot === "MORNING" || label.includes("breakfast")) {
        selectedType = "BREAKFAST";
      } else if (slot === "AFTERNOON" || label.includes("lunch")) {
        selectedType = "LUNCH";
      } else if (slot === "EVENING" || label.includes("dinner")) {
        selectedType = "DINNER";
      } else if (slot === "SNACK" || label.includes("snack")) {
        selectedType = "SNACK";
      } else {
        const hour = new Date().getHours();
        if (hour < 11) selectedType = "BREAKFAST";
        else if (hour < 16) selectedType = "LUNCH";
        else if (hour < 21) selectedType = "DINNER";
        else selectedType = "SNACK";
      }

      // Determine timestamp
      const now = new Date();
      let occurredAt = now.toISOString();
      if (scheduledDate) {
        const timePart = now.toTimeString().split(" ")[0]; // HH:mm:ss
        const combined = new Date(`${scheduledDate}T${timePart}`);
        if (!isNaN(combined.getTime())) {
          occurredAt = combined.toISOString();
        }
      }

      initDraft(selectedType, occurredAt);

      // Populate notes if available
      if (prefill?.note) {
        setNotes(prefill.note);
      } else if (prefill?.items?.length) {
        const itemDescriptions = prefill.items
          .map((i) => `${i.quantity ? `${i.quantity} ` : ""}${i.name || i.description || ""}`.trim())
          .filter(Boolean)
          .join(", ");
        if (itemDescriptions) setNotes(itemDescriptions);
      }

      // Pre-fill quick item if calories are specified
      if (prefill?.calories != null) {
        addQuickItem({
          itemName: prefill.label || prefill.name || "Planned meal",
          calories: Number(prefill.calories),
          proteinGrams: prefill.proteinGrams != null ? Number(prefill.proteinGrams) : null,
          carbohydrateGrams: prefill.carbsGrams != null ? Number(prefill.carbsGrams) : null,
          fatGrams: prefill.fatGrams != null ? Number(prefill.fatGrams) : null,
        });
      }
    }
  }, [isEdit, fromPlanState, initDraft, setNotes, addQuickItem]);

  // If new meal and no mealType is set (and not from plan), initialize with reasonable default based on current hour
  useEffect(() => {
    if (!isEdit && !fromPlanState && !mealType) {
      const hour = new Date().getHours();
      let defaultType = "LUNCH";
      if (hour < 11) defaultType = "BREAKFAST";
      else if (hour < 16) defaultType = "LUNCH";
      else if (hour < 21) defaultType = "DINNER";
      else defaultType = "SNACK";

      initDraft(defaultType);
    }
  }, [isEdit, fromPlanState, mealType, initDraft]);

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
              : fromPlanState
              ? `Logging from your plan: ${fromPlanState.prefill?.label || "Planned meal"}. Review items and save.`
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
