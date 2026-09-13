import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quickAddSchema } from "../nutrition.schemas.js";
import styles from "./QuickAddForm.module.css";

/**
 * Quick add form for meals.
 * Allows entering calories with optional name and macros.
 */
export default function QuickAddForm({ onConfirm, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(quickAddSchema),
    mode: "onChange",
    defaultValues: {
      itemName: "",
      calories: undefined,
      proteinGrams: undefined,
      carbohydrateGrams: undefined,
      fatGrams: undefined,
    },
  });

  const onSubmit = (values) => {
    onConfirm({
      itemName: values.itemName || undefined,
      calories: Number(values.calories),
      proteinGrams: values.proteinGrams !== undefined && values.proteinGrams !== null && values.proteinGrams !== "" ? Number(values.proteinGrams) : null,
      carbohydrateGrams: values.carbohydrateGrams !== undefined && values.carbohydrateGrams !== null && values.carbohydrateGrams !== "" ? Number(values.carbohydrateGrams) : null,
      fatGrams: values.fatGrams !== undefined && values.fatGrams !== null && values.fatGrams !== "" ? Number(values.fatGrams) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="quick-name" className={styles.label}>
          Item Name <span className={styles.optional}>(Optional)</span>
        </label>
        <input
          id="quick-name"
          type="text"
          placeholder="e.g., Afternoon latte"
          {...register("itemName")}
          className={styles.input}
        />
        {errors.itemName && <span className={styles.error}>{errors.itemName.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="quick-calories" className={styles.label}>
          Calories <span className={styles.required}>*</span>
        </label>
        <input
          id="quick-calories"
          type="number"
          step="1"
          min="1"
          placeholder="e.g., 250"
          {...register("calories", { valueAsNumber: true })}
          className={styles.input}
          autoFocus
        />
        {errors.calories && <span className={styles.error}>{errors.calories.message}</span>}
      </div>

      <div className={styles.macroRow}>
        <div className={styles.field}>
          <label htmlFor="quick-protein" className={styles.label}>
            Protein (g)
          </label>
          <input
            id="quick-protein"
            type="number"
            step="0.1"
            min="0"
            placeholder="0"
            {...register("proteinGrams", {
              setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
            })}
            className={styles.input}
          />
          {errors.proteinGrams && <span className={styles.error}>{errors.proteinGrams.message}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="quick-carbs" className={styles.label}>
            Carbs (g)
          </label>
          <input
            id="quick-carbs"
            type="number"
            step="0.1"
            min="0"
            placeholder="0"
            {...register("carbohydrateGrams", {
              setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
            })}
            className={styles.input}
          />
          {errors.carbohydrateGrams && <span className={styles.error}>{errors.carbohydrateGrams.message}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="quick-fat" className={styles.label}>
            Fat (g)
          </label>
          <input
            id="quick-fat"
            type="number"
            step="0.1"
            min="0"
            placeholder="0"
            {...register("fatGrams", {
              setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
            })}
            className={styles.input}
          />
          {errors.fatGrams && <span className={styles.error}>{errors.fatGrams.message}</span>}
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
          disabled={!isValid || isSubmitting}
          className={styles.submitBtn}
        >
          Add Quick Item
        </button>
      </div>
    </form>
  );
}
