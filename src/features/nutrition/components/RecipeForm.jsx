import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecipeSchema } from "../nutrition.schemas.js";
import { useCreateRecipe, useUpdateRecipe } from "../hooks/useRecipes.js";
import { normalizeApiError, mapValidationErrors } from "../../../api/normalizeApiError.js";
import { showError, showSuccess } from "../../../components/ui/Toast.jsx";
import RecipeIngredientPicker from "./RecipeIngredientPicker.jsx";
import styles from "./RecipeForm.module.css";

/**
 * Shared form for creating or updating a recipe.
 *
 * @param {{ initialRecipe?: RecipeDetails, isEdit?: boolean, onCancel?: () => void }} props
 */
export default function RecipeForm({ initialRecipe, isEdit = false, onCancel }) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const defaultIngredients = initialRecipe?.ingredients?.map((ing) => ({
    foodId: ing.food.id,
    quantityGrams: ing.quantityGrams,
    foodName: ing.food.nameEn,
  })) || [];

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(createRecipeSchema),
    mode: "onChange",
    defaultValues: {
      nameEn: initialRecipe?.nameEn || "",
      nameAr: initialRecipe?.nameAr || "",
      servings: initialRecipe?.servings || 1,
      countryCode: initialRecipe?.countryCode || "",
      cuisine: initialRecipe?.cuisine || "",
      instructions: initialRecipe?.instructions || "",
      ingredients: defaultIngredients,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const handleSelectFood = (food) => {
    // Check if food already in list
    const exists = fields.some((f) => f.foodId === food.id);
    if (exists) {
      showError("This food is already added. Adjust its quantity instead.");
      return;
    }

    append({
      foodId: food.id,
      quantityGrams: 100,
      foodName: food.nameEn,
    });
  };

  const onSubmit = (values) => {
    const payload = {
      nameEn: values.nameEn,
      nameAr: values.nameAr || null,
      servings: Number(values.servings),
      countryCode: values.countryCode ? values.countryCode.toUpperCase() : null,
      cuisine: values.cuisine || null,
      instructions: values.instructions || null,
      ingredients: values.ingredients.map((ing) => ({
        foodId: ing.foodId,
        quantityGrams: Number(ing.quantityGrams),
      })),
    };

    const mutationOptions = {
      onSuccess: (saved) => {
        showSuccess(isEdit ? "Recipe updated!" : "Recipe created!");
        navigate(`/app/recipes/${saved.id}`);
      },
      onError: (err) => {
        const normalized = normalizeApiError(err);
        if (normalized.code === "INVALID_SCHEMA") {
          mapValidationErrors(normalized, setError, [
            "nameEn",
            "nameAr",
            "servings",
            "countryCode",
            "cuisine",
            "instructions",
            "ingredients",
          ]);
        } else if (normalized.code === "INVALID_RECIPE_INGREDIENTS") {
          showError("One or more ingredients are unavailable.");
        } else {
          showError(normalized.message || "Failed to save recipe.");
        }
      },
    };

    if (isEdit) {
      updateMutation.mutate({ recipeId: initialRecipe.id, payload }, mutationOptions);
    } else {
      createMutation.mutate(payload, mutationOptions);
    }
  };

  const existingFoodIds = fields.map((f) => f.foodId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {/* BASIC DETAILS */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recipe Details</h2>

        <div className={styles.field}>
          <label htmlFor="recipe-nameEn" className={styles.label}>
            Recipe Name (English) <span className={styles.required}>*</span>
          </label>
          <input
            id="recipe-nameEn"
            type="text"
            placeholder="e.g., Chicken Rice Bowl"
            {...register("nameEn")}
            className={styles.input}
            autoFocus
          />
          {errors.nameEn && <span className={styles.error}>{errors.nameEn.message}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="recipe-nameAr" className={styles.label}>
            Arabic Name <span className={styles.optional}>(Optional)</span>
          </label>
          <input
            id="recipe-nameAr"
            type="text"
            placeholder="e.g., طبق دجاج بالأرز"
            dir="rtl"
            {...register("nameAr")}
            className={styles.input}
          />
          {errors.nameAr && <span className={styles.error}>{errors.nameAr.message}</span>}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="recipe-servings" className={styles.label}>
              Number of Servings <span className={styles.required}>*</span>
            </label>
            <input
              id="recipe-servings"
              type="number"
              min="0.1"
              step="any"
              placeholder="e.g., 2"
              {...register("servings", { valueAsNumber: true })}
              className={styles.input}
            />
            {errors.servings && <span className={styles.error}>{errors.servings.message}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="recipe-country" className={styles.label}>
              Country Code <span className={styles.optional}>(2-letter ISO)</span>
            </label>
            <input
              id="recipe-country"
              type="text"
              maxLength="2"
              placeholder="e.g., EG, US"
              {...register("countryCode")}
              className={styles.input}
            />
            {errors.countryCode && (
              <span className={styles.error}>{errors.countryCode.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="recipe-cuisine" className={styles.label}>
              Cuisine <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="recipe-cuisine"
              type="text"
              placeholder="e.g., Mediterranean"
              {...register("cuisine")}
              className={styles.input}
            />
            {errors.cuisine && <span className={styles.error}>{errors.cuisine.message}</span>}
          </div>
        </div>
      </div>

      {/* INGREDIENTS LIST */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Ingredients</h2>
            <span className={styles.sectionSub}>Add at least 1 food ingredient.</span>
          </div>
          <button
            type="button"
            className={styles.addIngBtn}
            onClick={() => setPickerOpen(true)}
          >
            + Add Food
          </button>
        </div>

        {errors.ingredients?.root && (
          <span className={styles.error}>{errors.ingredients.root.message}</span>
        )}
        {errors.ingredients?.message && (
          <span className={styles.error}>{errors.ingredients.message}</span>
        )}

        {fields.length === 0 ? (
          <div className={styles.emptyIngredients} onClick={() => setPickerOpen(true)}>
            <p className={styles.emptyText}>No ingredients added yet.</p>
            <span className={styles.emptySub}>Tap "+ Add Food" to pick ingredients.</span>
          </div>
        ) : (
          <ul className={styles.ingList}>
            {fields.map((field, index) => (
              <li key={field.id} className={styles.ingRow}>
                <span className={styles.ingName}>{field.foodName || `Food #${index + 1}`}</span>

                <div className={styles.ingRight}>
                  <div className={styles.qtyBox}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Grams"
                      {...register(`ingredients.${index}.quantityGrams`, {
                        valueAsNumber: true,
                      })}
                      className={styles.qtyInput}
                    />
                    <span className={styles.qtyUnit}>g</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className={styles.removeIngBtn}
                    aria-label="Remove ingredient"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* INSTRUCTIONS */}
      <div className={styles.section}>
        <label htmlFor="recipe-instructions" className={styles.label}>
          Preparation Instructions <span className={styles.optional}>(Optional)</span>
        </label>
        <textarea
          id="recipe-instructions"
          rows="4"
          placeholder="Describe how to prepare this recipe..."
          {...register("instructions")}
          className={styles.textarea}
        />
        {errors.instructions && (
          <span className={styles.error}>{errors.instructions.message}</span>
        )}
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel || (() => navigate(-1))}
          disabled={isSaving}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || fields.length === 0}
          className={styles.submitBtn}
        >
          {isSaving ? "Saving..." : isEdit ? "Update Recipe" : "Save Recipe"}
        </button>
      </div>

      {/* INGREDIENT PICKER */}
      <RecipeIngredientPicker
        open={pickerOpen}
        onSelect={handleSelectFood}
        onClose={() => setPickerOpen(false)}
        existingFoodIds={existingFoodIds}
      />
    </form>
  );
}
