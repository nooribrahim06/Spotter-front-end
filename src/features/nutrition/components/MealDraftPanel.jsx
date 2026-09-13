import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MEAL_TYPES,
  mealTypeMeta,
  isoToDateTimeLocal,
  dateTimeLocalToIso,
  defaultOccurredAt,
  formatCalories,
  formatNutrient,
} from "../nutrition.domain.js";
import { useMealDraftStore } from "../../../stores/mealDraftStore.js";
import { useCreateMeal, useUpdateMeal } from "../hooks/useMeals.js";
import { normalizeApiError } from "../../../api/normalizeApiError.js";
import { showError, showSuccess } from "../../../components/ui/Toast.jsx";
import MealTypeIcon from "./MealTypeIcon.jsx";
import MacroChips from "./MacroChips.jsx";
import NutritionBar from "./NutritionBar.jsx";
import FoodRecipePicker from "./FoodRecipePicker.jsx";
import styles from "./MealDraftPanel.module.css";

export default function MealDraftPanel({ onSaved, onCancel }) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const {
    mealType,
    occurredAt,
    notes,
    items,
    editingMealId,
    setMealType,
    setOccurredAt,
    setNotes,
    removeItem,
    clearDraft,
    toSaveMealRequest,
  } = useMealDraftStore();

  const createMutation = useCreateMeal();
  const updateMutation = useUpdateMeal();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Calculate live running totals from items
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let macrosComplete = true;

  for (const item of items) {
    if (item.calories != null) {
      totalCalories += item.calories;
    }
    if (item.proteinGrams != null) {
      totalProtein += item.proteinGrams;
    } else {
      macrosComplete = false;
    }
    if (item.carbohydrateGrams != null) {
      totalCarbs += item.carbohydrateGrams;
    } else {
      macrosComplete = false;
    }
    if (item.fatGrams != null) {
      totalFat += item.fatGrams;
    } else {
      macrosComplete = false;
    }
  }

  // Handlers
  const handleMealTypeSelect = (type) => {
    setMealType(type);
    if (!occurredAt) {
      setOccurredAt(defaultOccurredAt(type));
    }
  };

  const handleDateTimeChange = (e) => {
    const localVal = e.target.value;
    if (localVal) {
      setOccurredAt(dateTimeLocalToIso(localVal));
    }
  };

  const handleSave = () => {
    setFieldErrors({});

    const payload = toSaveMealRequest();
    if (!payload) {
      if (!mealType) setFieldErrors((e) => ({ ...e, mealType: "Select a meal type" }));
      if (!occurredAt) setFieldErrors((e) => ({ ...e, occurredAt: "Select date and time" }));
      if (items.length === 0) showError("Add at least one item to save this meal.");
      return;
    }

    // Check future time client-side
    const mealDate = new Date(payload.occurredAt);
    const maxFuture = new Date(Date.now() + 5 * 60 * 1000);
    if (mealDate > maxFuture) {
      setFieldErrors((e) => ({
        ...e,
        occurredAt: "Meal time cannot be more than five minutes in the future.",
      }));
      return;
    }

    const mutationOptions = {
      onSuccess: (savedMeal) => {
        showSuccess(editingMealId ? "Meal updated!" : "Meal logged!");
        clearDraft();
        if (onSaved) {
          onSaved(savedMeal);
        } else {
          navigate("/app/home");
        }
      },
      onError: (err) => {
        const normalized = normalizeApiError(err);
        switch (normalized.code) {
          case "INVALID_MEAL_ITEMS":
            showError("One or more items are no longer available. Please remove them.");
            break;
          case "MEAL_TIMEZONE_REQUIRED":
            showError("Please set your timezone in your profile settings.");
            break;
          case "INVALID_MEAL_TIME":
            setFieldErrors((e) => ({ ...e, occurredAt: "Invalid meal timestamp." }));
            break;
          case "INVALID_SCHEMA":
            if (normalized.details) {
              const errMap = {};
              normalized.details.forEach((d) => {
                errMap[d.field] = d.message;
              });
              setFieldErrors(errMap);
            }
            break;
          default:
            showError(normalized.message || "Failed to save meal.");
        }
      },
    };

    if (editingMealId) {
      updateMutation.mutate({ mealId: editingMealId, payload }, mutationOptions);
    } else {
      createMutation.mutate(payload, mutationOptions);
    }
  };

  return (
    <div className={styles.container}>
      {/* MEAL TYPE SELECTOR */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          Meal Type <span className={styles.required}>*</span>
        </label>
        <div className={styles.mealTypeGrid}>
          {MEAL_TYPES.map((type) => {
            const meta = mealTypeMeta(type);
            const isSelected = mealType === type;
            return (
              <button
                key={type}
                type="button"
                className={`${styles.typeBtn} ${isSelected ? styles.typeBtnSelected : ""}`}
                onClick={() => handleMealTypeSelect(type)}
              >
                <span className={styles.typeIcon}>
                  <MealTypeIcon name={meta.icon} size={20} />
                </span>
                <span className={styles.typeLabel}>{meta.label}</span>
              </button>
            );
          })}
        </div>
        {fieldErrors.mealType && <span className={styles.error}>{fieldErrors.mealType}</span>}
      </div>

      {/* DATE & TIME SELECTOR */}
      <div className={styles.section}>
        <label htmlFor="meal-datetime" className={styles.sectionLabel}>
          Date & Time <span className={styles.required}>*</span>
        </label>
        <input
          id="meal-datetime"
          type="datetime-local"
          value={isoToDateTimeLocal(occurredAt)}
          onChange={handleDateTimeChange}
          className={styles.dateTimeInput}
        />
        {fieldErrors.occurredAt && <span className={styles.error}>{fieldErrors.occurredAt}</span>}
      </div>

      {/* RUNNING TOTALS SUMMARY */}
      <div className={styles.summaryBox}>
        <div className={styles.summaryHeader}>
          <span className={styles.summaryTitle}>Running Totals</span>
          <span className={styles.summaryItemCount}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <MacroChips
          calories={totalCalories}
          proteinGrams={totalProtein}
          carbohydrateGrams={totalCarbs}
          fatGrams={totalFat}
          macrosComplete={macrosComplete}
          size="md"
        />
        <NutritionBar
          proteinGrams={totalProtein}
          carbohydrateGrams={totalCarbs}
          fatGrams={totalFat}
        />
      </div>

      {/* ITEMS LIST */}
      <div className={styles.section}>
        <div className={styles.itemsHeader}>
          <label className={styles.sectionLabel}>Items</label>
          <button
            type="button"
            className={styles.addItemBtn}
            onClick={() => setPickerOpen(true)}
          >
            + Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyItems} onClick={() => setPickerOpen(true)}>
            <div className={styles.emptyIcon}>🍽️</div>
            <p className={styles.emptyText}>No items added to this meal yet.</p>
            <span className={styles.emptyHint}>Tap "+ Add Item" to browse foods & recipes.</span>
          </div>
        ) : (
          <ul className={styles.itemsList}>
            {items.map((item, index) => (
              <li key={`draft-item-${index}`} className={styles.itemRow}>
                <div className={styles.itemBadge} data-type={item.itemType}>
                  {item.itemType === "FOOD" ? "F" : item.itemType === "RECIPE" ? "R" : "Q"}
                </div>
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>
                    {item.itemName || (item.itemType === "FOOD" ? "Food Item" : item.itemType === "RECIPE" ? "Recipe" : "Quick Item")}
                  </span>
                  <span className={styles.itemMeta}>
                    {item.itemType === "FOOD" && `${item.quantityGrams}g`}
                    {item.itemType === "RECIPE" && `${item.servings} serving${item.servings !== 1 ? "s" : ""}`}
                    {item.itemType === "QUICK" && "Quick add"}
                    {item.calories != null && ` · ${formatCalories(item.calories)} cal`}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.deleteItemBtn}
                  onClick={() => removeItem(index)}
                  aria-label="Remove item"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* NOTES */}
      <div className={styles.section}>
        <label htmlFor="meal-notes" className={styles.sectionLabel}>
          Notes <span className={styles.optional}>(Optional)</span>
        </label>
        <textarea
          id="meal-notes"
          rows="3"
          placeholder="How did you feel? Any substitutions?"
          value={notes || ""}
          onChange={(e) => setNotes(e.target.value)}
          className={styles.notesInput}
        />
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || items.length === 0}
          className={styles.saveBtn}
        >
          {isSaving ? "Saving..." : editingMealId ? "Update Meal" : "Log Meal"}
        </button>
      </div>

      {/* FOOD / RECIPE PICKER SHEET */}
      <FoodRecipePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
