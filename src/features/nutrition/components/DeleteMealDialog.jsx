import { mealTypeMeta, formatMealTime } from "../nutrition.domain.js";
import { useDeleteMeal } from "../hooks/useMeals.js";
import { normalizeApiError } from "../../../api/normalizeApiError.js";
import { showSuccess, showError } from "../../../components/ui/Toast.jsx";
import styles from "./DeleteMealDialog.module.css";

/**
 * DeleteMealDialog — Confirmation dialog for meal deletion.
 *
 * No password required per the API contract.
 * Uses the same dialog styling pattern as AppLayout's logout confirm.
 *
 * @param {{ meal: Meal, open: boolean, onClose: () => void }} props
 */
export default function DeleteMealDialog({ meal, open, onClose }) {
  const deleteMutation = useDeleteMeal();

  if (!open || !meal) return null;

  const meta = mealTypeMeta(meal.mealType);

  function handleDelete() {
    deleteMutation.mutate(meal.id, {
      onSuccess: () => {
        showSuccess(`${meta.label} deleted`);
        onClose();
      },
      onError: (error) => {
        const normalized = normalizeApiError(error);
        if (normalized.code === "MEAL_NOT_FOUND") {
          showError("This meal was already deleted.");
          onClose();
        } else {
          showError("Something went wrong. Please try again.");
        }
      },
    });
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-meal-title"
        aria-describedby="delete-meal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.mark}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </div>

        <p className={styles.badge}>Delete Meal</p>
        <h2 id="delete-meal-title">Delete {meta.label}?</h2>
        <span id="delete-meal-desc" className={styles.desc}>
          This will permanently remove your {meta.label.toLowerCase()} at {formatMealTime(meal.occurredAt)} and all its items. This cannot be undone.
        </span>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
