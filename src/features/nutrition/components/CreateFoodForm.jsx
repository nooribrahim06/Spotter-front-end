import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFoodSchema } from "../nutrition.schemas.js";
import { useCreateFood } from "../hooks/useFoods.js";
import { normalizeApiError, mapValidationErrors } from "../../../api/normalizeApiError.js";
import { showError, showSuccess } from "../../../components/ui/Toast.jsx";
import styles from "./CreateFoodForm.module.css";

/**
 * Inline form inside the food picker for creating custom user foods.
 */
export default function CreateFoodForm({ onSuccess, onCancel }) {
  const createFoodMutation = useCreateFood();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(createFoodSchema),
    mode: "onChange",
    defaultValues: {
      nameEn: "",
      nameAr: "",
      category: "",
      caloriesPer100g: undefined,
      proteinGramsPer100g: undefined,
      carbohydrateGramsPer100g: undefined,
      fatGramsPer100g: undefined,
    },
  });

  const onSubmit = (values) => {
    createFoodMutation.mutate(values, {
      onSuccess: (food) => {
        showSuccess("Custom food created!");
        onSuccess(food);
      },
      onError: (err) => {
        const normalized = normalizeApiError(err);
        if (normalized.code === "INVALID_SCHEMA") {
          mapValidationErrors(normalized, setError, [
            "nameEn",
            "nameAr",
            "category",
            "caloriesPer100g",
            "proteinGramsPer100g",
            "carbohydrateGramsPer100g",
            "fatGramsPer100g",
          ]);
        } else {
          showError(normalized.message || "Failed to create food.");
        }
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {onCancel && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={onCancel}
            aria-label="Back to food list"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h3 className={styles.title}>Create Custom Food</h3>
          <p className={styles.subtitle}>Enter nutrition values per 100 grams.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="food-nameEn" className={styles.label}>
            Food Name (English) <span className={styles.required}>*</span>
          </label>
          <input
            id="food-nameEn"
            type="text"
            placeholder="e.g., Homemade Protein Shake"
            {...register("nameEn")}
            className={styles.input}
            autoFocus
          />
          {errors.nameEn && <span className={styles.error}>{errors.nameEn.message}</span>}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="food-nameAr" className={styles.label}>
              Arabic Name <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="food-nameAr"
              type="text"
              placeholder="e.g., بروتين شيك منزلي"
              dir="rtl"
              {...register("nameAr")}
              className={styles.input}
            />
            {errors.nameAr && <span className={styles.error}>{errors.nameAr.message}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="food-category" className={styles.label}>
              Category <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="food-category"
              type="text"
              placeholder="e.g., Protein, Dairy"
              {...register("category")}
              className={styles.input}
            />
            {errors.category && <span className={styles.error}>{errors.category.message}</span>}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="food-calories" className={styles.label}>
            Calories per 100g <span className={styles.required}>*</span>
          </label>
          <input
            id="food-calories"
            type="number"
            step="1"
            min="0"
            max="1000"
            placeholder="0 – 1000"
            {...register("caloriesPer100g", { valueAsNumber: true })}
            className={styles.input}
          />
          {errors.caloriesPer100g && (
            <span className={styles.error}>{errors.caloriesPer100g.message}</span>
          )}
        </div>

        <div className={styles.macroRow}>
          <div className={styles.field}>
            <label htmlFor="food-protein" className={styles.label}>
              Protein (g) <span className={styles.required}>*</span>
            </label>
            <input
              id="food-protein"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0 – 100"
              {...register("proteinGramsPer100g", { valueAsNumber: true })}
              className={styles.input}
            />
            {errors.proteinGramsPer100g && (
              <span className={styles.error}>{errors.proteinGramsPer100g.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="food-carbs" className={styles.label}>
              Carbs (g) <span className={styles.required}>*</span>
            </label>
            <input
              id="food-carbs"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0 – 100"
              {...register("carbohydrateGramsPer100g", { valueAsNumber: true })}
              className={styles.input}
            />
            {errors.carbohydrateGramsPer100g && (
              <span className={styles.error}>{errors.carbohydrateGramsPer100g.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="food-fat" className={styles.label}>
              Fat (g) <span className={styles.required}>*</span>
            </label>
            <input
              id="food-fat"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0 – 100"
              {...register("fatGramsPer100g", { valueAsNumber: true })}
              className={styles.input}
            />
            {errors.fatGramsPer100g && (
              <span className={styles.error}>{errors.fatGramsPer100g.message}</span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {onCancel && (
            <button type="button" onClick={onCancel} className={styles.cancelBtn}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!isValid || isSubmitting || createFoodMutation.isPending}
            className={styles.submitBtn}
          >
            {createFoodMutation.isPending ? "Creating..." : "Save Food"}
          </button>
        </div>
      </form>
    </div>
  );
}
