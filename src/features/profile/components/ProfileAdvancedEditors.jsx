import { useState } from "react";
import Button from "../../../components/ui/Button.jsx";
import {
  ChoiceGrid,
  EditorShell,
  Field,
  OptionList,
  SelectInput,
  StepActions,
  StepHeader,
  TagInput,
  Textarea,
  TextInput,
  Toggle,
} from "./ProfileFormControls.jsx";
import { optionalNumber } from "../profile.utils.js";
import styles from "./ProfileForm.module.css";

const EMPTY_HEALTH = {
  healthConditions: [], movementLimitations: [], specialPlanningStates: [], safetyNotes: null,
};

function reconcileCodes(nextCodes, currentItems, defaults = {}) {
  return nextCodes.map((code) => currentItems.find((item) => item.code === code) || { code, ...defaults });
}

export function HealthEditor({ profile, onClose, onSave, isSaving, serverError }) {
  const source = profile.bodyProfile?.healthProfile || EMPTY_HEALTH;
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    healthConditions: source.healthConditions || [],
    movementLimitations: source.movementLimitations || [],
    specialPlanningStates: source.specialPlanningStates || [],
    safetyNotes: source.safetyNotes || "",
  });
  const submit = async (event) => {
    event.preventDefault();
    await onSave("health", {
      healthConditions: values.healthConditions.map((item) => ({ code: item.code, notes: item.notes || null, active: item.active ?? true })),
      movementLimitations: values.movementLimitations
        .filter((item) => item.bodyRegion && item.trigger)
        .map((item) => ({ bodyRegion: item.bodyRegion, trigger: item.trigger, notes: item.notes || null })),
      specialPlanningStates: values.specialPlanningStates.map((item) => ({ code: item.code, notes: item.notes || null })),
      safetyNotes: values.safetyNotes.trim() || null,
    }, "Health and safety details updated");
  };

  return (
    <EditorShell eyebrow="Private fitness data" title="Health & safety" description="Spotter uses this layer to adapt plans. The overview never exposes the details." onClose={onClose} onSubmit={submit} isSaving={isSaving} serverError={serverError}>
      {step === 1 && <>
        <StepHeader step={1} total={3} title="Health conditions" description="Add only information that should affect your fitness planning." />
        <TagInput label="Active conditions" hint="Type a short label such as high blood pressure, then press Add." values={values.healthConditions.map((item) => item.code)} onChange={(codes) => setValues((current) => ({ ...current, healthConditions: reconcileCodes(codes, current.healthConditions, { notes: null, active: true }) }))} placeholder="Add a condition" />
        {values.healthConditions.map((item, index) => <Field key={item.code} label={`Notes for ${item.code.replaceAll("_", " ").toLowerCase()}`} hint="Optional"><TextInput value={item.notes || ""} onChange={(event) => setValues((current) => ({ ...current, healthConditions: current.healthConditions.map((row, rowIndex) => rowIndex === index ? { ...row, notes: event.target.value } : row) }))} maxLength="500" /></Field>)}
      </>}
      {step === 2 && <>
        <StepHeader step={2} total={3} title="Movement limitations" description="Connect a body area with the movement that causes trouble." />
        <div className={styles.dynamicList}>
          {values.movementLimitations.map((item, index) => <div className={styles.dynamicRow} key={index}>
            <Field label="Body area"><TextInput value={item.bodyRegion} onChange={(event) => setValues((current) => ({ ...current, movementLimitations: current.movementLimitations.map((row, rowIndex) => rowIndex === index ? { ...row, bodyRegion: event.target.value.toUpperCase().replace(/\s+/g, "_") } : row) }))} placeholder="Right knee" /></Field>
            <Field label="Trigger"><TextInput value={item.trigger} onChange={(event) => setValues((current) => ({ ...current, movementLimitations: current.movementLimitations.map((row, rowIndex) => rowIndex === index ? { ...row, trigger: event.target.value.toUpperCase().replace(/\s+/g, "_") } : row) }))} placeholder="Deep squat" /></Field>
            <button type="button" className={styles.removeButton} onClick={() => setValues((current) => ({ ...current, movementLimitations: current.movementLimitations.filter((_, rowIndex) => rowIndex !== index) }))} aria-label={`Remove limitation ${index + 1}`}>×</button>
          </div>)}
          <Button type="button" variant="secondary" className={styles.addButton} onClick={() => setValues((current) => ({ ...current, movementLimitations: [...current.movementLimitations, { bodyRegion: "", trigger: "", notes: null }] }))}>Add limitation</Button>
        </div>
      </>}
      {step === 3 && <>
        <StepHeader step={3} total={3} title="Planning notes" description="Add situations such as post-surgery recovery, plus anything a plan should always consider." />
        <TagInput label="Special planning states" hint="Examples: post surgery, pregnant, doctor restricted exercise." values={values.specialPlanningStates.map((item) => item.code)} onChange={(codes) => setValues((current) => ({ ...current, specialPlanningStates: reconcileCodes(codes, current.specialPlanningStates, { notes: null }) }))} placeholder="Add a planning state" />
        <Field label="Safety notes" hint="Optional private context for safer planning."><Textarea rows="4" maxLength="2000" value={values.safetyNotes} onChange={(event) => setValues((current) => ({ ...current, safetyNotes: event.target.value }))} /></Field>
      </>}
      <StepActions step={step} total={3} setStep={setStep} />
    </EditorShell>
  );
}

const EMPTY_NUTRITION = {
  dietaryPreferenceCodes: [], foodAllergies: [], foodIntolerances: [], foodPreferences: [],
  mealsPerDay: null, snacksPerDay: null, planStyle: null, cookingSkill: null,
  maxMealPrepMinutes: null, kitchenAccess: null, foodBudgetLevel: null,
};

export function NutritionEditor({ profile, config, onClose, onSave, isSaving, serverError }) {
  const source = profile.bodyProfile?.nutritionProfile || EMPTY_NUTRITION;
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({ ...EMPTY_NUTRITION, ...source });
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    await onSave("nutrition", {
      dietaryPreferenceCodes: values.dietaryPreferenceCodes,
      foodAllergies: values.foodAllergies
        .filter((item) => item.code)
        .map((item) => ({ code: item.code, severity: item.severity || null, notes: item.notes || null })),
      foodIntolerances: values.foodIntolerances.map((item) => ({ code: item.code, notes: item.notes || null })),
      foodPreferences: values.foodPreferences
        .filter((item) => item.food.trim())
        .map((item) => ({ food: item.food.trim(), preference: item.preference })),
      mealsPerDay: optionalNumber(values.mealsPerDay),
      snacksPerDay: optionalNumber(values.snacksPerDay),
      planStyle: values.planStyle || null,
      cookingSkill: values.cookingSkill || null,
      maxMealPrepMinutes: optionalNumber(values.maxMealPrepMinutes),
      kitchenAccess: values.kitchenAccess || null,
      foodBudgetLevel: values.foodBudgetLevel || null,
    }, "Food preferences updated");
  };

  return (
    <EditorShell eyebrow="Private fitness data" title="Food preferences" description="A short guided setup keeps allergies separate from routine and cooking choices." onClose={onClose} onSubmit={submit} isSaving={isSaving} serverError={serverError}>
      {step === 1 && <>
        <StepHeader step={1} total={3} title="Needs & preferences" description="Start with what must be respected, then add foods you enjoy or avoid." />
        <TagInput label="Dietary needs" hint="Examples: halal, vegetarian, gluten free." values={values.dietaryPreferenceCodes} onChange={(items) => setValues((current) => ({ ...current, dietaryPreferenceCodes: items }))} placeholder="Add a dietary need" />
        <div className={styles.dynamicList}>
          <div className={styles.sectionHeading}><h3>Allergies</h3><p>Keep safety-critical items visible and specific.</p></div>
          {values.foodAllergies.map((item, index) => <div className={styles.dynamicRow} key={index}>
            <Field label="Allergy"><TextInput value={item.code} onChange={(event) => setValues((current) => ({ ...current, foodAllergies: current.foodAllergies.map((row, rowIndex) => rowIndex === index ? { ...row, code: event.target.value.toUpperCase().replace(/\s+/g, "_") } : row) }))} /></Field>
            <Field label="Severity"><SelectInput value={item.severity || ""} onChange={(event) => setValues((current) => ({ ...current, foodAllergies: current.foodAllergies.map((row, rowIndex) => rowIndex === index ? { ...row, severity: event.target.value || null } : row) }))}><option value="">Not set</option><OptionList values={["MILD", "MODERATE", "SEVERE"]} /></SelectInput></Field>
            <button type="button" className={styles.removeButton} onClick={() => setValues((current) => ({ ...current, foodAllergies: current.foodAllergies.filter((_, rowIndex) => rowIndex !== index) }))} aria-label={`Remove allergy ${index + 1}`}>×</button>
          </div>)}
          <Button type="button" variant="secondary" className={styles.addButton} onClick={() => setValues((current) => ({ ...current, foodAllergies: [...current.foodAllergies, { code: "", severity: null, notes: null }] }))}>Add allergy</Button>
        </div>
        <TagInput label="Intolerances" values={values.foodIntolerances.map((item) => item.code)} onChange={(codes) => setValues((current) => ({ ...current, foodIntolerances: reconcileCodes(codes, current.foodIntolerances, { notes: null }) }))} placeholder="Add an intolerance" />
        <div className={styles.dynamicList}>
          <div className={styles.sectionHeading}><h3>Foods you like or avoid</h3></div>
          {values.foodPreferences.map((item, index) => <div className={styles.dynamicRow} key={index}>
            <Field label="Food"><TextInput value={item.food} onChange={(event) => setValues((current) => ({ ...current, foodPreferences: current.foodPreferences.map((row, rowIndex) => rowIndex === index ? { ...row, food: event.target.value } : row) }))} /></Field>
            <Field label="Preference"><SelectInput value={item.preference} onChange={(event) => setValues((current) => ({ ...current, foodPreferences: current.foodPreferences.map((row, rowIndex) => rowIndex === index ? { ...row, preference: event.target.value } : row) }))}><OptionList values={["LIKE", "DISLIKE", "AVOID"]} /></SelectInput></Field>
            <button type="button" className={styles.removeButton} onClick={() => setValues((current) => ({ ...current, foodPreferences: current.foodPreferences.filter((_, rowIndex) => rowIndex !== index) }))} aria-label={`Remove food preference ${index + 1}`}>×</button>
          </div>)}
          <Button type="button" variant="secondary" className={styles.addButton} onClick={() => setValues((current) => ({ ...current, foodPreferences: [...current.foodPreferences, { food: "", preference: "LIKE" }] }))}>Add food</Button>
        </div>
      </>}
      {step === 2 && <>
        <StepHeader step={2} total={3} title="Daily rhythm" description="A few broad choices are enough to shape a realistic food plan." />
        <div className={styles.formGrid}>
          <Field label="Meals per day"><TextInput type="number" min="1" max="10" value={values.mealsPerDay ?? ""} onChange={set("mealsPerDay")} /></Field>
          <Field label="Snacks per day"><TextInput type="number" min="0" max="10" value={values.snacksPerDay ?? ""} onChange={set("snacksPerDay")} /></Field>
        </div>
        <Field label="Plan style"><SelectInput value={values.planStyle || ""} onChange={set("planStyle")}><OptionList values={config.nutritionPlanStyles} includeUnset /></SelectInput></Field>
      </>}
      {step === 3 && <>
        <StepHeader step={3} total={3} title="Kitchen reality" description="Match recommendations to your time, equipment, skills, and budget." />
        <div className={styles.formGrid}>
          <Field label="Cooking skill"><SelectInput value={values.cookingSkill || ""} onChange={set("cookingSkill")}><OptionList values={config.cookingSkills} includeUnset /></SelectInput></Field>
          <Field label="Kitchen access"><SelectInput value={values.kitchenAccess || ""} onChange={set("kitchenAccess")}><OptionList values={config.kitchenAccess} includeUnset /></SelectInput></Field>
          <Field label="Maximum prep time (minutes)"><TextInput type="number" min="0" max="480" value={values.maxMealPrepMinutes ?? ""} onChange={set("maxMealPrepMinutes")} /></Field>
          <Field label="Food budget"><SelectInput value={values.foodBudgetLevel || ""} onChange={set("foodBudgetLevel")}><OptionList values={config.foodBudgetLevels} includeUnset /></SelectInput></Field>
        </div>
      </>}
      <StepActions step={step} total={3} setStep={setStep} />
    </EditorShell>
  );
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EMPTY_TRAINING = {
  overallExperienceLevel: null, resistanceTrainingLevel: null, cardioTrainingLevel: null,
  currentlyTrainingConsistently: false, trainingDaysPerWeek: null, availableDays: [],
  preferredSessionMinutes: null, trainingEnvironment: null, availableEquipment: [],
  preferredTrainingStyles: [], preferredCardioType: null, averageSleepMinutes: null,
  sleepQuality: null, typicalStressLevel: null,
};

export function TrainingEditor({ profile, config, onClose, onSave, isSaving, serverError }) {
  const source = profile.bodyProfile?.trainingProfile || EMPTY_TRAINING;
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({ ...EMPTY_TRAINING, ...source });
  const [localError, setLocalError] = useState("");
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const toggleDay = (day, checked) => setValues((current) => ({ ...current, availableDays: checked ? [...current.availableDays.filter((item) => item.day !== day), { day, available: true, preferred: false, maxMinutes: current.preferredSessionMinutes || null }].sort((a, b) => a.day - b.day) : current.availableDays.filter((item) => item.day !== day) }));
  const submit = async (event) => {
    event.preventDefault();
    const availableDayCount = values.availableDays.filter((item) => item.available).length;
    if (values.trainingDaysPerWeek !== "" && values.trainingDaysPerWeek !== null && Number(values.trainingDaysPerWeek) > availableDayCount) {
      setLocalError("Planned training days can’t exceed the days you marked available.");
      setStep(2);
      return;
    }
    setLocalError("");
    await onSave("training", {
      overallExperienceLevel: values.overallExperienceLevel || null,
      resistanceTrainingLevel: values.resistanceTrainingLevel || null,
      cardioTrainingLevel: values.cardioTrainingLevel || null,
      currentlyTrainingConsistently: Boolean(values.currentlyTrainingConsistently),
      trainingDaysPerWeek: optionalNumber(values.trainingDaysPerWeek),
      availableDays: values.availableDays
        .filter((item) => item.available)
        .map((item) => ({ day: item.day, available: true, preferred: Boolean(item.preferred), maxMinutes: optionalNumber(item.maxMinutes) })),
      preferredSessionMinutes: optionalNumber(values.preferredSessionMinutes),
      trainingEnvironment: values.trainingEnvironment || null,
      availableEquipment: values.availableEquipment
        .filter((item) => item.code)
        .map((item) => ({ code: item.code, quantity: optionalNumber(item.quantity), maxWeightKg: optionalNumber(item.maxWeightKg) })),
      preferredTrainingStyles: values.preferredTrainingStyles,
      preferredCardioType: values.preferredCardioType?.trim() || null,
      averageSleepMinutes: optionalNumber(values.averageSleepMinutes),
      sleepQuality: optionalNumber(values.sleepQuality),
      typicalStressLevel: optionalNumber(values.typicalStressLevel),
    }, "Training setup updated");
  };

  return (
    <EditorShell eyebrow="Private fitness data" title="Training setup" description="Experience, schedule, and recovery are split into three small decisions." onClose={onClose} onSubmit={submit} isSaving={isSaving} serverError={serverError || (localError ? { message: localError } : null)}>
      {step === 1 && <>
        <StepHeader step={1} total={3} title="Experience" description="This keeps recommendations challenging without skipping foundations." />
        <div className={styles.formGrid}>
          <Field label="Overall experience"><SelectInput value={values.overallExperienceLevel || ""} onChange={set("overallExperienceLevel")}><OptionList values={config.trainingExperienceLevels} includeUnset /></SelectInput></Field>
          <Field label="Resistance training"><SelectInput value={values.resistanceTrainingLevel || ""} onChange={set("resistanceTrainingLevel")}><OptionList values={config.trainingExperienceLevels} includeUnset /></SelectInput></Field>
          <Field label="Cardio training"><SelectInput value={values.cardioTrainingLevel || ""} onChange={set("cardioTrainingLevel")}><OptionList values={config.trainingExperienceLevels} includeUnset /></SelectInput></Field>
        </div>
        <Toggle label="I’m training consistently now" checked={Boolean(values.currentlyTrainingConsistently)} onChange={(checked) => setValues((current) => ({ ...current, currentlyTrainingConsistently: checked }))} />
      </>}
      {step === 2 && <>
        <StepHeader step={2} total={3} title="Schedule" description="Mark real availability first; Spotter won’t plan more days than you have." />
        <fieldset className={styles.choiceFieldset}>
          <legend>Available days</legend>
          <div className={styles.dayGrid}>{DAY_NAMES.map((name, index) => { const day = index + 1; return <label className={styles.dayChoice} key={name}><input type="checkbox" checked={values.availableDays.some((item) => item.day === day && item.available)} onChange={(event) => toggleDay(day, event.target.checked)} /><span>{name.slice(0, 3)}</span></label>; })}</div>
        </fieldset>
        <div className={styles.formGrid}>
          <Field label="Training days per week"><TextInput type="number" min="0" max="7" value={values.trainingDaysPerWeek ?? ""} onChange={set("trainingDaysPerWeek")} /></Field>
          <Field label="Preferred session (minutes)"><TextInput type="number" min={config.constraints.sessionMinutes.min} max={config.constraints.sessionMinutes.max} value={values.preferredSessionMinutes ?? ""} onChange={set("preferredSessionMinutes")} /></Field>
        </div>
        <Field label="Training environment"><SelectInput value={values.trainingEnvironment || ""} onChange={set("trainingEnvironment")}><OptionList values={config.trainingEnvironments} includeUnset /></SelectInput></Field>
      </>}
      {step === 3 && <>
        <StepHeader step={3} total={3} title="Preferences & recovery" description="Optional details help plans fit your equipment, sleep, and stress." />
        <TagInput label="Preferred training styles" hint="Examples: full body, circuits, strength." values={values.preferredTrainingStyles} onChange={(items) => setValues((current) => ({ ...current, preferredTrainingStyles: items }))} placeholder="Add a style" />
        <Field label="Preferred cardio"><TextInput value={values.preferredCardioType || ""} onChange={set("preferredCardioType")} placeholder="Walking" maxLength="100" /></Field>
        <div className={styles.dynamicList}>
          <div className={styles.sectionHeading}><h3>Available equipment</h3><p>Add only equipment you expect to use.</p></div>
          {values.availableEquipment.map((item, index) => <div className={styles.dynamicRow} key={index}>
            <Field label="Equipment"><TextInput value={item.code} onChange={(event) => setValues((current) => ({ ...current, availableEquipment: current.availableEquipment.map((row, rowIndex) => rowIndex === index ? { ...row, code: event.target.value.toUpperCase().replace(/\s+/g, "_") } : row) }))} /></Field>
            <Field label="Quantity"><TextInput type="number" min="1" max="100" value={item.quantity ?? ""} onChange={(event) => setValues((current) => ({ ...current, availableEquipment: current.availableEquipment.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: event.target.value } : row) }))} /></Field>
            <button type="button" className={styles.removeButton} onClick={() => setValues((current) => ({ ...current, availableEquipment: current.availableEquipment.filter((_, rowIndex) => rowIndex !== index) }))} aria-label={`Remove equipment ${index + 1}`}>×</button>
          </div>)}
          <Button type="button" variant="secondary" className={styles.addButton} onClick={() => setValues((current) => ({ ...current, availableEquipment: [...current.availableEquipment, { code: "", quantity: null, maxWeightKg: null }] }))}>Add equipment</Button>
        </div>
        <div className={styles.formGrid}>
          <Field label="Average sleep (hours)" hint="Converted to minutes when saved."><TextInput type="number" min="0" max="24" step="0.5" value={values.averageSleepMinutes == null ? "" : Number(values.averageSleepMinutes) / 60} onChange={(event) => setValues((current) => ({ ...current, averageSleepMinutes: event.target.value === "" ? null : Number(event.target.value) * 60 }))} /></Field>
          <Field label="Sleep quality (1–10)"><TextInput type="number" min="1" max="10" value={values.sleepQuality ?? ""} onChange={set("sleepQuality")} /></Field>
          <Field label="Typical stress (1–10)"><TextInput type="number" min="1" max="10" value={values.typicalStressLevel ?? ""} onChange={set("typicalStressLevel")} /></Field>
        </div>
      </>}
      <StepActions step={step} total={3} setStep={setStep} />
    </EditorShell>
  );
}
