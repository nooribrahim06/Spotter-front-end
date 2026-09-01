import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../components/ui/Button.jsx";
import { mapValidationErrors } from "../../../api/normalizeApiError.js";
import {
  GOAL_TYPES,
  goalTypeMeta,
  normalizeGoalPayload,
  validateGoalPayload,
  WEIGHT_REQUIRED_TYPES,
} from "../goals.domain.js";
import GoalIcon from "./GoalIcon.jsx";
import styles from "./GoalForm.module.css";

const FIELD_NAMES = ["goalType", "targetWeightKg", "targetDate"];

function tomorrow() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function GoalForm({ initialGoal, onSubmit, onCancel, apiError, isSaving }) {
  const firstTypeRef = useRef(null);
  const defaults = useMemo(
    () => ({
      goalType: initialGoal?.goalType || "",
      targetWeightKg: initialGoal?.targetWeightKg ?? "",
      targetDate: initialGoal?.targetDate || "",
    }),
    [initialGoal]
  );
  const {
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: defaults });
  const goalType = watch("goalType");
  const showWeight = goalType && goalType !== "MAINTAIN_WEIGHT";
  const weightRequired = WEIGHT_REQUIRED_TYPES.has(goalType);

  useEffect(() => {
    if (goalType === "MAINTAIN_WEIGHT") {
      setValue("targetWeightKg", "", { shouldDirty: true });
      clearErrors("targetWeightKg");
    }
  }, [clearErrors, goalType, setValue]);

  useEffect(() => {
    if (!apiError) return;
    if (apiError.code === "INVALID_SCHEMA") {
      mapValidationErrors(apiError, setError, FIELD_NAMES);
    } else if (apiError.code === "GOAL_TYPE_CHANGE_REQUIRED") {
      setError("goalType", {
        type: "server",
        message: "Choose a compatible direction before saving this change.",
      });
      firstTypeRef.current?.focus();
    }
  }, [apiError, setError]);

  function submit(values) {
    clearErrors();
    const payload = normalizeGoalPayload(values);
    const validationErrors = validateGoalPayload(payload);
    if (Object.keys(validationErrors).length) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field, { type: "validate", message });
      });
      return;
    }
    onSubmit(payload, { setError });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
      <fieldset className={styles.typeFieldset} aria-describedby={errors.goalType ? "goal-type-error" : undefined}>
        <legend>What are you working toward?</legend>
        <p>Pick a direction. You can fine-tune a saved draft anytime.</p>
        <div className={styles.typeGrid}>
          {GOAL_TYPES.map((type, index) => {
            const meta = goalTypeMeta(type);
            const selected = goalType === type;
            return (
              <label key={type} className={`${styles.typeCard} ${selected ? styles.typeCardSelected : ""}`}>
                <input
                  {...register("goalType")}
                  ref={(element) => {
                    register("goalType").ref(element);
                    if (index === 0) firstTypeRef.current = element;
                  }}
                  type="radio"
                  value={type}
                />
                <span className={styles.typeIcon}><GoalIcon name={meta.icon} /></span>
                <span className={styles.typeCopy}>
                  <strong>{meta.label}</strong>
                  <small>{meta.description}</small>
                </span>
                <span className={styles.typeCheck}><GoalIcon name="check" /></span>
              </label>
            );
          })}
        </div>
        {errors.goalType && <span id="goal-type-error" className={styles.error} role="alert">{errors.goalType.message}</span>}
      </fieldset>

      {goalType && (
        <div className={styles.details}>
          <div className={styles.detailsHeading}>
            <span>02</span>
            <div><h3>Shape your destination</h3><p>Just enough detail to make the goal yours.</p></div>
          </div>

          <div className={`${styles.fields} ${!showWeight ? styles.singleField : ""}`}>
            {showWeight && (
              <label className={styles.field}>
                <span>Target weight <small>{weightRequired ? "Required" : "Optional"}</small></span>
                <span className={styles.weightInput}>
                  <input
                    {...register("targetWeightKg")}
                    type="number"
                    inputMode="decimal"
                    min="30"
                    max="350"
                    step="0.1"
                    placeholder={weightRequired ? "e.g. 72" : "Add one if it helps"}
                    aria-invalid={Boolean(errors.targetWeightKg) || undefined}
                    aria-describedby={errors.targetWeightKg ? "target-weight-error" : "target-weight-hint"}
                  />
                  <b>kg</b>
                </span>
                <small id="target-weight-hint">Your destination, not a judgment.</small>
                {errors.targetWeightKg && <em id="target-weight-error" role="alert">{errors.targetWeightKg.message}</em>}
              </label>
            )}

            <label className={styles.field}>
              <span>Target date <small>Optional</small></span>
              <span className={styles.dateInput}>
                <GoalIcon name="calendar" />
                <input
                  {...register("targetDate")}
                  type="date"
                  min={tomorrow()}
                  aria-invalid={Boolean(errors.targetDate) || undefined}
                  aria-describedby={errors.targetDate ? "target-date-error" : "target-date-hint"}
                />
              </span>
              <small id="target-date-hint">Leave it open if a deadline adds pressure.</small>
              {errors.targetDate && <em id="target-date-error" role="alert">{errors.targetDate.message}</em>}
            </label>
          </div>
        </div>
      )}

      {errors.root && <div className={styles.formError} role="alert">{errors.root.message}</div>}
      {apiError && !["INVALID_SCHEMA", "GOAL_TYPE_CHANGE_REQUIRED"].includes(apiError.code) && (
        <div className={styles.formError} role="alert">
          {apiError.code === "DATABASE_ERROR"
            ? "Spotter couldn't save that just now. Your choices are still here—try again."
            : apiError.message}
        </div>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>Not now</Button>
        <Button type="submit" isLoading={isSaving} disabled={!goalType}>
          {initialGoal ? "Save changes" : "Save as draft"}
        </Button>
      </div>
      {!initialGoal && <p className={styles.lifecycleNote}>Saving keeps this flexible. You’ll choose when to make it your active goal.</p>}
    </form>
  );
}
