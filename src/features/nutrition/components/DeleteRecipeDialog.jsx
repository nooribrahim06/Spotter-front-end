import { useState } from "react";
import { useDeleteRecipe } from "../hooks/useRecipes.js";
import { normalizeApiError } from "../../../api/normalizeApiError.js";
import { showError, showSuccess } from "../../../components/ui/Toast.jsx";
import styles from "./DeleteRecipeDialog.module.css";

/**
 * Delete recipe confirmation dialog requiring account password.
 */
export default function DeleteRecipeDialog({ recipe, open, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const deleteMutation = useDeleteRecipe();

  if (!open || !recipe) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!password.trim()) {
      setPasswordError("Password is required to delete a recipe.");
      return;
    }

    deleteMutation.mutate(
      { recipeId: recipe.id, password },
      {
        onSuccess: () => {
          showSuccess(`Recipe "${recipe.nameEn}" deleted.`);
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          const normalized = normalizeApiError(err);
          if (normalized.code === "INVALID_PASSWORD_CONFIRMATION") {
            setPasswordError("Incorrect account password. Please try again.");
          } else if (normalized.code === "RECIPE_NOT_FOUND") {
            showError("This recipe was already deleted.");
            onClose();
            if (onSuccess) onSuccess();
          } else {
            showError(normalized.message || "Failed to delete recipe.");
          }
        },
      }
    );
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-recipe-title"
        aria-describedby="delete-recipe-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.mark}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </div>

        <p className={styles.badge}>Delete Recipe</p>
        <h2 id="delete-recipe-title">Delete "{recipe.nameEn}"?</h2>
        <span id="delete-recipe-desc" className={styles.desc}>
          This will archive your recipe. Existing meal snapshots that reference this recipe will remain unchanged. To confirm, enter your account password.
        </span>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="delete-recipe-password" className={styles.label}>
              Account Password
            </label>
            <input
              id="delete-recipe-password"
              type="password"
              placeholder="Enter your current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              autoFocus
            />
            {passwordError && <span className={styles.error}>{passwordError}</span>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={deleteMutation.isPending}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteMutation.isPending || !password.trim()}
              className={styles.confirmDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
