import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import CursorOrb from "../../components/landing/CursorOrb.jsx";
import { BitCharacter } from "../../components/landing/BitCharacter.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useAuthStore } from "../../stores/authStore.js";
import { normalizeApiError } from "../../api/normalizeApiError.js";
import {
  completeOnboarding,
  loadOnboarding,
  saveOnboardingStep,
} from "../../features/onboarding/api/onboarding.api.js";
import {
  ACTIVITY_COPY,
  GOAL_COPY,
  buildStepOnePayload,
  buildStepTwoPayload,
  kgToPounds,
  savedDataToFormValues,
} from "../../features/onboarding/onboarding.domain.js";
import {
  stepOneSchema,
  stepTwoSchema,
} from "../../features/onboarding/onboarding.schemas.js";
import maleAthlete from "../../assets/onboarding/athlete-male.png";
import femaleAthlete from "../../assets/onboarding/athlete-female.png";
import styles from "./Onboarding.module.css";

const STEP_META = {
  1: { eyebrow: "About you", title: "Give your journey a real starting point.", note: "The essentials Spotter uses to understand your baseline." },
  2: { eyebrow: "Goal + activity", title: "Tell us where movement should take you.", note: "Choose the direction. We'll learn the details later." },
  3: { eyebrow: "Review", title: "Your starting story, in one clear view.", note: "Nothing is locked. Go back and adjust anything that feels off." },
};

const DEFAULT_VALUES = savedDataToFormValues();

function Field({ label, error, hint, children, className = "" }) {
  return (
    <label className={`${styles.field} ${className}`}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && !error && <small>{hint}</small>}
      {error && <small className={styles.fieldError} role="alert">{error}</small>}
    </label>
  );
}

function SelectionCard({ name, value, register, selected, title, note, symbol }) {
  return (
    <label className={styles.selectionCard} data-selected={selected || undefined}>
      <input type="radio" value={value} {...register(name)} />
      <span className={styles.selectionSymbol} aria-hidden="true">{symbol}</span>
      <span><strong>{title}</strong><small>{note}</small></span>
      <i aria-hidden="true">✓</i>
    </label>
  );
}

export default function OnboardingPage() {
  const { step: stepParam } = useParams();
  const requestedStep = Math.min(3, Math.max(1, Number(stepParam) || 1));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageRef = useRef(null);
  const panelRef = useRef(null);
  const formPaneRef = useRef(null);
  const completionLock = useRef(false);
  const [direction, setDirection] = useState(1);
  const updateUser = useAuthStore((state) => state.updateUser);

  const {
    register,
    reset,
    watch,
    getValues,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_VALUES, mode: "onChange" });

  const onboarding = useQuery({
    queryKey: ["onboarding"],
    queryFn: loadOnboarding,
    staleTime: Infinity,
  });

  const saveMutation = useMutation({ mutationFn: saveOnboardingStep });
  const completeMutation = useMutation({ mutationFn: completeOnboarding });

  const values = watch();
  const unitSystem = values.preferredUnitSystem || "METRIC";
  const selectedSex = values.sexForCalculation;
  const targetVisible = values.goalType && values.goalType !== "MAINTAIN_WEIGHT";
  const targetRequired = ["LOSE_WEIGHT", "GAIN_WEIGHT"].includes(values.goalType);

  useEffect(() => {
    document.title = `Onboarding ${requestedStep} of 3 — Spotter`;
  }, [requestedStep]);
  useEffect(() => {
    if (formPaneRef.current) formPaneRef.current.scrollTop = 0;
  }, [requestedStep]);


  useEffect(() => {
    if (!onboarding.data) return;
    if (onboarding.data.status === "completed") {
      if (completionLock.current) return;
      navigate("/app/home", { replace: true });
      return;
    }

    reset(savedDataToFormValues(onboarding.data.data));
    const allowedStep = onboarding.data.status === "not_started"
      ? 1
      : onboarding.data.currentStep || 1;
    if (requestedStep > allowedStep) {
      navigate(`/onboarding/${allowedStep}`, { replace: true });
    }
  }, [onboarding.data, navigate, requestedStep, reset]);

  useGSAP(
    () => {
      if (!panelRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        panelRef.current,
        { x: direction * 90, opacity: 0, filter: "blur(8px)" },
        { x: 0, opacity: 1, filter: "blur(0px)", duration: .68, ease: "power3.out" },
      );
    },
    { scope: pageRef, dependencies: [requestedStep] },
  );

  useEffect(() => {
    if (values.goalType === "MAINTAIN_WEIGHT") {
      // Keep hidden values out of the eventual API payload.
      clearErrors(["targetWeightKg", "targetWeightLb"]);
    }
  }, [values.goalType, clearErrors]);

  const goToStep = (nextStep) => {
    const nextDirection = nextStep > requestedStep ? 1 : -1;
    setDirection(nextDirection);
    const changeRoute = () => navigate(`/onboarding/${nextStep}`);
    if (!panelRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      changeRoute();
      return;
    }
    gsap.to(panelRef.current, {
      x: nextDirection > 0 ? -85 : 85,
      opacity: 0,
      filter: "blur(7px)",
      duration: .34,
      ease: "power2.in",
      onComplete: changeRoute,
    });
  };

  const showValidationErrors = (result, fieldMap = {}) => {
    clearErrors();
    result.error.issues.forEach((issue) => {
      const sourceField = issue.path[0] || "root";
      const field = fieldMap[sourceField] || sourceField;
      setError(field, { type: "validation", message: issue.message });
    });
  };

  const showServiceError = (error, fieldMap = {}) => {
    const normalized = normalizeApiError(error);
    if (normalized.details?.length) {
      normalized.details.forEach((detail) => {
        setError(fieldMap[detail.field] || detail.field || "root", {
          type: "server",
          message: detail.message,
        });
      });
      return;
    }
    setError("root", {
      type: "server",
      message: normalized.isNetworkError
        ? "We couldn't save this step. Check your connection and try again."
        : "This step couldn't be saved. Please try again.",
    });
  };

  const saveStep = async () => {
    const formValues = getValues();
    const fieldMap = unitSystem === "IMPERIAL"
      ? { heightCm: "heightFeet", currentWeightKg: "currentWeightLb", targetWeightKg: "targetWeightLb" }
      : {};

    if (requestedStep === 1) {
      const payload = buildStepOnePayload(formValues);
      const result = stepOneSchema.safeParse(payload);
      if (!result.success) {
        showValidationErrors(result, fieldMap);
        return;
      }

      try {
        const response = await saveMutation.mutateAsync({ step: 1, data: result.data });
        queryClient.setQueryData(["onboarding"], (current) => ({
          ...current,
          ...response,
          data: { ...current?.data, ...result.data },
        }));
        goToStep(2);
      } catch (error) {
        showServiceError(error, fieldMap);
      }
      return;
    }

    if (requestedStep === 2) {
      const payload = buildStepTwoPayload(formValues);
      const result = stepTwoSchema.safeParse(payload);
      if (!result.success) {
        showValidationErrors(result, fieldMap);
        return;
      }

      try {
        const response = await saveMutation.mutateAsync({ step: 2, data: result.data });
        queryClient.setQueryData(["onboarding"], (current) => ({
          ...current,
          ...response,
          data: { ...current?.data, ...result.data },
        }));
        goToStep(3);
      } catch (error) {
        showServiceError(error, fieldMap);
      }
    }
  };

  const finish = async () => {
    if (completionLock.current || completeMutation.isPending) return;
    completionLock.current = true;
    clearErrors();
    try {
      const response = await completeMutation.mutateAsync();
      updateUser({
        ...response.user,
        firstName: values.firstName,
        lastName: values.lastName,
        sexForCalculation: values.sexForCalculation,
      });
      queryClient.setQueryData(["onboarding"], (current) => ({
        ...current,
        status: "completed",
        currentStep: null,
      }));
      navigate("/onboarding/success", { replace: true });
    } catch (error) {
      completionLock.current = false;
      showServiceError(error);
    }
  };

  const summary = useMemo(() => {
    const stepOne = buildStepOnePayload(values);
    const stepTwo = buildStepTwoPayload(values);
    return { ...stepOne, ...stepTwo };
  }, [values]);

  if (onboarding.isLoading) {
    return <div className={styles.onboardingLoader}><Spinner size="lg" /><p>Bringing back your progress…</p></div>;
  }

  if (onboarding.isError) {
    return (
      <div className={styles.onboardingLoader}>
        <BitCharacter state="disappointed" decorative />
        <h1>We couldn&apos;t load your starting point.</h1>
        <button type="button" className={styles.startButton} onClick={() => onboarding.refetch()}>Try again</button>
      </div>
    );
  }

  return (
    <div ref={pageRef} className={styles.onboardingPage} data-step={requestedStep}>
      <CursorOrb className={styles.onboardingCursor} />
      <header className={styles.formNav}>
        <span className={styles.brand}>SPOTTER<span>.</span></span>
        <div className={styles.progress} role="progressbar" aria-label={`Onboarding step ${requestedStep} of 3`} aria-valuenow={requestedStep} aria-valuemin="1" aria-valuemax="3">
          {[1, 2, 3].map((step) => (
            <span key={step} data-active={step <= requestedStep || undefined}>
              <i /> <b>{String(step).padStart(2, "0")}</b>
            </span>
          ))}
        </div>
        <span className={styles.saveState}>{saveMutation.isPending ? "Saving…" : "Progress saves each step"}</span>
      </header>

      <main className={styles.formLayout}>
        <section className={styles.guidePane} data-has-athlete={requestedStep > 1 || undefined}>
          <div className={styles.visualGrid} aria-hidden="true" />
          <span className={styles.stepWatermark} aria-hidden="true">0{requestedStep}</span>

          {requestedStep === 1 ? (
            <div className={styles.dualAthletes} aria-hidden="true">
              <img src={maleAthlete} alt="" />
              <img src={femaleAthlete} alt="" />
            </div>
          ) : (
            <div className={styles.chosenAthlete} data-sex={selectedSex || "MALE"} key={selectedSex || "athlete"} aria-hidden="true">
              <img src={selectedSex === "FEMALE" ? femaleAthlete : maleAthlete} alt="" />
            </div>
          )}

          <div className={styles.smallBit} aria-hidden="true">
            <BitCharacter state={requestedStep === 3 ? "celebrating" : "aiCoach"} decorative />
          </div>
          {requestedStep === 1 && <div className={styles.coachBubble}>
            <span>BIT SAYS</span>
            <p>Choose what feels true today. We can refine the story later.</p>
          </div>}
        </section>

        <section ref={formPaneRef} className={styles.formPane}>
          <div ref={panelRef} className={styles.stepPanel} key={requestedStep}>
            <header className={styles.stepHeader}>
              <p>{STEP_META[requestedStep].eyebrow} <span>Step {requestedStep} of 3</span></p>
              <h1>{STEP_META[requestedStep].title}</h1>
              <div>{STEP_META[requestedStep].note}</div>
            </header>

            {errors.root && (
              <div className={styles.formError} role="alert">
                <span>!</span><p>{errors.root.message}</p>
              </div>
            )}

            {requestedStep === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.nameGrid}>
                  <Field label="First name" error={errors.firstName?.message}>
                    <input className={styles.textInput} aria-label="First name" autoComplete="given-name" placeholder="Your first name" {...register("firstName")} />
                  </Field>
                  <Field label="Second name" error={errors.lastName?.message}>
                    <input className={styles.textInput} aria-label="Second name" autoComplete="family-name" placeholder="Your second name" {...register("lastName")} />
                  </Field>
                  <fieldset className={styles.birthDateField}>
                    <legend>Date of birth</legend>
                    <input className={styles.textInput} aria-label="Date of birth" type="date" {...register("birthDate")} />
                    <small>Choose your complete date. You must be 18 or older.</small>
                    {(errors.birthDay || errors.birthMonth || errors.birthYear) && (
                      <small className={styles.fieldError} role="alert">{errors.birthDay?.message || errors.birthMonth?.message || errors.birthYear?.message}</small>
                    )}
                  </fieldset>
                </div>

                <fieldset className={styles.optionFieldset}>
                  <legend>Sex used for fitness calculations</legend>
                  <p>This helps future energy estimates. It isn&apos;t your gender identity.</p>
                  <div className={styles.sexOptions}>
                    <SelectionCard name="sexForCalculation" value="MALE" register={register} selected={selectedSex === "MALE"} title="Male" note="Use male calculation constants" symbol="M" />
                    <SelectionCard name="sexForCalculation" value="FEMALE" register={register} selected={selectedSex === "FEMALE"} title="Female" note="Use female calculation constants" symbol="F" />
                  </div>
                  {errors.sexForCalculation && <small className={styles.fieldError} role="alert">{errors.sexForCalculation.message}</small>}
                </fieldset>

                <div className={styles.measureHeader}>
                  <span>Measurements</span>
                  <div className={styles.unitToggle}>
                    {[["METRIC", "Metric"], ["IMPERIAL", "Imperial"]].map(([value, label]) => (
                      <label key={value} data-selected={unitSystem === value || undefined}>
                        <input type="radio" value={value} {...register("preferredUnitSystem")} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {unitSystem === "METRIC" ? (
                  <div className={styles.measureGrid}>
                    <Field label="Height" error={errors.heightCm?.message}>
                      <div className={styles.inputWithUnit}><input aria-label="Height" type="number" step="0.1" inputMode="decimal" placeholder="178" {...register("heightCm", { valueAsNumber: true })} /><span>cm</span></div>
                    </Field>
                    <Field label="Current weight" error={errors.currentWeightKg?.message}>
                      <div className={styles.inputWithUnit}><input aria-label="Current weight" type="number" step="0.1" inputMode="decimal" placeholder="82.5" {...register("currentWeightKg", { valueAsNumber: true })} /><span>kg</span></div>
                    </Field>
                  </div>
                ) : (
                  <div className={styles.measureGridImperial}>
                    <Field label="Height" error={errors.heightFeet?.message}>
                      <div className={styles.heightInputs}>
                        <div className={styles.inputWithUnit}><input aria-label="Height feet" type="number" inputMode="numeric" placeholder="5" {...register("heightFeet", { valueAsNumber: true })} /><span>ft</span></div>
                        <div className={styles.inputWithUnit}><input aria-label="Height inches" type="number" inputMode="numeric" placeholder="10" {...register("heightInches", { valueAsNumber: true })} /><span>in</span></div>
                      </div>
                    </Field>
                    <Field label="Current weight" error={errors.currentWeightLb?.message}>
                      <div className={styles.inputWithUnit}><input aria-label="Current weight" type="number" step="0.1" inputMode="decimal" placeholder="182" {...register("currentWeightLb", { valueAsNumber: true })} /><span>lb</span></div>
                    </Field>
                  </div>
                )}

                <label className={styles.confirmation} data-checked={values.adultConfirmed || undefined}>
                  <input type="checkbox" {...register("adultConfirmed")} />
                  <i aria-hidden="true">✓</i>
                  <span><strong>I confirm I&apos;m 18 or older.</strong><small>Spotter&apos;s MVP fitness onboarding is for adults.</small></span>
                </label>
                {errors.adultConfirmed && <small className={styles.fieldError} role="alert">{errors.adultConfirmed.message}</small>}
              </div>
            )}

            {requestedStep === 2 && (
              <div className={styles.stepContent}>
                <fieldset className={styles.optionFieldset}>
                  <legend>What matters most right now?</legend>
                  <div className={styles.goalGrid}>
                    {Object.entries(GOAL_COPY).map(([value, copy], index) => (
                      <SelectionCard key={value} name="goalType" value={value} register={register} selected={values.goalType === value} title={copy.label} note={copy.note} symbol={String(index + 1).padStart(2, "0")} />
                    ))}
                  </div>
                  {errors.goalType && <small className={styles.fieldError} role="alert">{errors.goalType.message}</small>}
                </fieldset>

                {targetVisible && (
                  <div className={styles.targetRow}>
                    <Field label={`Target weight${targetRequired ? "" : " (optional)"}`} error={(unitSystem === "IMPERIAL" ? errors.targetWeightLb : errors.targetWeightKg)?.message}>
                      <div className={styles.inputWithUnit}>
                        <input aria-label="Target weight" type="number" step="0.1" inputMode="decimal" placeholder={unitSystem === "IMPERIAL" ? "165" : "75"} {...register(unitSystem === "IMPERIAL" ? "targetWeightLb" : "targetWeightKg", { valueAsNumber: true })} />
                        <span>{unitSystem === "IMPERIAL" ? "lb" : "kg"}</span>
                      </div>
                    </Field>
                    <Field label="Target date (optional)" error={errors.targetDate?.message}>
                      <input className={styles.textInput} aria-label="Target date (optional)" type="date" {...register("targetDate")} />
                    </Field>
                  </div>
                )}

                <fieldset className={styles.optionFieldset}>
                  <legend>How active is life lately?</legend>
                  <div className={styles.activityGrid}>
                    {Object.entries(ACTIVITY_COPY).map(([value, copy], index) => (
                      <SelectionCard key={value} name="activityLevel" value={value} register={register} selected={values.activityLevel === value} title={copy.label} note={copy.note} symbol={`0${index + 1}`} />
                    ))}
                  </div>
                  {errors.activityLevel && <small className={styles.fieldError} role="alert">{errors.activityLevel.message}</small>}
                </fieldset>
              </div>
            )}

            {requestedStep === 3 && (
              <div className={styles.reviewGrid}>
                <button type="button" className={styles.reviewCard} onClick={() => goToStep(1)}>
                  <span>01 / You</span><i aria-hidden="true">Edit ↗</i>
                  <h2>{summary.firstName} {summary.lastName}</h2>
                  <p>{summary.sexForCalculation === "FEMALE" ? "Female" : "Male"} calculation · Born {String(summary.birthDay).padStart(2, "0")}/{String(summary.birthMonth).padStart(2, "0")}/{summary.birthYear}</p>
                </button>
                <button type="button" className={styles.reviewCard} onClick={() => goToStep(1)}>
                  <span>02 / Baseline</span><i aria-hidden="true">Edit ↗</i>
                  <h2>{summary.currentWeightKg || "—"} kg</h2>
                  <p>{summary.heightCm || "—"} cm tall · {summary.preferredUnitSystem?.toLowerCase()} display</p>
                </button>
                <button type="button" className={`${styles.reviewCard} ${styles.reviewWide}`} onClick={() => goToStep(2)}>
                  <span>03 / Direction</span><i aria-hidden="true">Edit ↗</i>
                  <h2>{GOAL_COPY[summary.goalType]?.label || "Choose a goal"}</h2>
                  <p>{ACTIVITY_COPY[summary.activityLevel]?.label || "Choose an activity level"}{summary.targetWeightKg ? ` · ${summary.targetWeightKg} kg target` : ""}</p>
                </button>
                <div className={styles.reviewNotice}>
                  <i aria-hidden="true">●</i>
                  <p><strong>This is a starting point, not a verdict.</strong> Your information can evolve as Spotter learns your real routine.</p>
                </div>
              </div>
            )}

            <footer className={styles.stepActions}>
              {requestedStep > 1 ? (
                <button type="button" className={styles.backButton} onClick={() => goToStep(requestedStep - 1)} disabled={saveMutation.isPending || completeMutation.isPending}>
                  <span aria-hidden="true">←</span> Back
                </button>
              ) : <span />}
              <button
                type="button"
                className={styles.continueButton}
                onClick={requestedStep === 3 ? finish : saveStep}
                disabled={saveMutation.isPending || completeMutation.isPending}
              >
                <span>{saveMutation.isPending ? "Saving this step…" : completeMutation.isPending ? "Building your start…" : requestedStep === 3 ? "Complete my setup" : "Save and continue"}</span>
                <i aria-hidden="true">↗</i>
              </button>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
