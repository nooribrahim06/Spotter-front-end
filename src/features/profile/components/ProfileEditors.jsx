import { useState } from "react";
import Button from "../../../components/ui/Button.jsx";
import PasswordInput from "../../../components/ui/PasswordInput.jsx";
import {
  ChoiceGrid,
  EditorShell,
  Field,
  OptionList,
  SelectInput,
  Textarea,
  TextInput,
  Toggle,
} from "./ProfileFormControls.jsx";
import { getServerFieldError, optionalNumber } from "../profile.utils.js";
import { detectBrowserTimezone, getTimezoneList } from "../timezone.js";
import styles from "./ProfileForm.module.css";

function firstError(errors) {
  return Object.values(errors).find(Boolean) || "";
}

export function PublicProfileEditor({ profile, onClose, onSave, isSaving, serverError }) {
  const source = profile.userProfile || {};
  const [values, setValues] = useState({
    firstName: source.firstName || "",
    lastName: source.lastName || "",
    displayName: source.displayName || "",
    bio: source.bio || "",
  });
  const [errors, setErrors] = useState({});
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      firstName: values.firstName.trim().length < 2 ? "Use at least 2 characters." : "",
      lastName: values.lastName.trim().length < 2 ? "Use at least 2 characters." : "",
      displayName: values.displayName.trim().length > 50 ? "Keep this under 50 characters." : "",
      bio: values.bio.trim().length > 500 ? "Keep this under 500 characters." : "",
    };
    setErrors(nextErrors);
    if (firstError(nextErrors)) return;

    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      displayName: values.displayName.trim() || null,
      bio: values.bio.trim() || null,
    };
    await onSave("public", payload, "Personal details updated");
  };

  return (
    <EditorShell eyebrow="Profile layer" title="Personal details" description="The name and short introduction Spotter can use around the app." onClose={onClose} onSubmit={submit} isSaving={isSaving} serverError={serverError}>
      <div className={styles.formGrid}>
        <Field label="First name" error={errors.firstName || getServerFieldError(serverError, "firstName")}>
          <TextInput value={values.firstName} onChange={set("firstName")} autoComplete="given-name" maxLength="40" />
        </Field>
        <Field label="Last name" error={errors.lastName || getServerFieldError(serverError, "lastName")}>
          <TextInput value={values.lastName} onChange={set("lastName")} autoComplete="family-name" maxLength="40" />
        </Field>
        <Field className={styles.fullWidth} label="Display name" hint="Optional. This can be shorter than your full name." error={errors.displayName || getServerFieldError(serverError, "displayName")}>
          <TextInput value={values.displayName} onChange={set("displayName")} maxLength="50" />
        </Field>
        <Field className={styles.fullWidth} label="A little about you" hint={`${values.bio.length}/500 characters. Leave blank to keep this private.`} error={errors.bio || getServerFieldError(serverError, "bio")}>
          <Textarea value={values.bio} onChange={set("bio")} maxLength="500" rows="4" />
        </Field>
      </div>
    </EditorShell>
  );
}

export function AccountPreferencesEditor({ profile, onClose, onSave, isSaving, serverError }) {
  const account = profile.account;
  const detected = detectBrowserTimezone();
  const [values, setValues] = useState({
    language: account.language || "en",
    country: account.country || "",
    timezone: account.timezone || detected,
  });
  const [errors, setErrors] = useState({});
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const timezones = getTimezoneList(values.timezone);

  const submit = async (event) => {
    event.preventDefault();
    let timezoneValid = true;
    try { if (values.timezone.trim()) new Intl.DateTimeFormat("en", { timeZone: values.timezone.trim() }).format(); } catch { timezoneValid = false; }
    const nextErrors = {
      language: /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(values.language.trim()) ? "" : "Use a language code such as en or en-GB.",
      country: !values.country.trim() || /^[A-Za-z]{2}$/.test(values.country.trim()) ? "" : "Use a two-letter country code such as EG.",
      timezone: timezoneValid ? "" : "Use a valid timezone such as Africa/Cairo.",
    };
    setErrors(nextErrors);
    if (firstError(nextErrors)) return;
    await onSave("account", {
      language: values.language.trim(),
      country: values.country.trim() || null,
      timezone: values.timezone.trim() || null,
    }, "Region and language updated");
  };

  return (
    <EditorShell eyebrow="Profile layer" title="Region & language" description="These choices keep dates, language, and local suggestions relevant to you." onClose={onClose} onSubmit={submit} isSaving={isSaving} serverError={serverError}>
      <Field label="Language" hint="Use a short language code, for example en or ar." error={errors.language || getServerFieldError(serverError, "language")}>
        <TextInput value={values.language} onChange={set("language")} maxLength="10" autoCapitalize="none" />
      </Field>
      <Field label="Country" hint="Optional two-letter code, for example EG." error={errors.country || getServerFieldError(serverError, "country")}>
        <TextInput value={values.country} onChange={set("country")} maxLength="2" autoCapitalize="characters" />
      </Field>
      <Field label="Timezone" hint="Your device timezone is a good default." error={errors.timezone || getServerFieldError(serverError, "timezone")}>
        <SelectInput value={values.timezone} onChange={set("timezone")} aria-label="Timezone">
          <option value="">Select timezone</option>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </SelectInput>
      </Field>
    </EditorShell>
  );
}

function BodyDangerZone({ onDelete, isSaving }) {
  const [password, setPassword] = useState("");
  return (
    <details className={styles.dangerZone}>
      <summary>Delete fitness profile</summary>
      <form className={styles.dangerBody} onSubmit={(event) => { event.preventDefault(); onDelete(password); }}>
        <p>This removes body, health, food, training, and progress data. Your account and coach preferences stay available.</p>
        <ul><li>Active and draft goals are cancelled.</li><li>Fitness onboarding resets.</li></ul>
        <Field label="Confirm with your password">
          <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </Field>
        <Button variant="danger" type="submit" disabled={!password || isSaving} isLoading={isSaving}>Delete fitness profile</Button>
      </form>
    </details>
  );
}

export function BodyProfileEditor({ profile, config, onClose, onSave, onDelete, isSaving, serverError }) {
  const body = profile.bodyProfile;
  const creating = !body;
  const [values, setValues] = useState({
    birthDate: body?.birthDate || "",
    sexForCalculation: body?.sexForCalculation || config.sexForCalculation[0],
    preferredUnitSystem: body?.preferredUnitSystem || config.unitSystems[0],
    heightCm: body?.heightCm ?? "",
    startingWeightKg: body?.startingWeightKg ?? "",
    activityLevel: body?.activityLevel || config.activityLevels[0],
    adultConfirmed: !creating,
  });
  const [errors, setErrors] = useState({});
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const height = Number(values.heightCm);
    const weight = Number(values.startingWeightKg);
    const nextErrors = {
      birthDate: values.birthDate ? "" : "Choose your date of birth.",
      heightCm: height >= config.constraints.heightCm.min && height <= config.constraints.heightCm.max ? "" : `Use ${config.constraints.heightCm.min}–${config.constraints.heightCm.max} cm.`,
      startingWeightKg: !creating || (weight >= config.constraints.weightKg.min && weight <= config.constraints.weightKg.max) ? "" : `Use ${config.constraints.weightKg.min}–${config.constraints.weightKg.max} kg.`,
      adultConfirmed: !creating || values.adultConfirmed ? "" : "Please confirm that you are 18 or older.",
    };
    setErrors(nextErrors);
    if (firstError(nextErrors)) return;

    const payload = {
      birthDate: values.birthDate,
      sexForCalculation: values.sexForCalculation,
      preferredUnitSystem: values.preferredUnitSystem,
      heightCm: height,
      activityLevel: values.activityLevel,
      ...(creating ? { startingWeightKg: weight, adultConfirmed: true } : {}),
    };
    await onSave("body", payload, creating ? "Fitness profile created" : "Body basics updated");
  };

  return (
    <EditorShell eyebrow="Fitness profile" title={creating ? "Set up body basics" : "Body basics"} description="Stable details used for safe estimates. New weight belongs in a progress check-in." onClose={onClose} onSubmit={submit} isSaving={isSaving} serverError={serverError} submitLabel={creating ? "Create fitness profile" : "Save changes"} footer={!creating ? <BodyDangerZone onDelete={onDelete} isSaving={isSaving} /> : null}>
      <div className={styles.formGrid}>
        <Field label="Date of birth" error={errors.birthDate || getServerFieldError(serverError, "birthDate")}>
          <TextInput type="date" value={values.birthDate} onChange={set("birthDate")} />
        </Field>
        <Field label="Height (cm)" error={errors.heightCm || getServerFieldError(serverError, "heightCm")}>
          <TextInput type="number" value={values.heightCm} onChange={set("heightCm")} min={config.constraints.heightCm.min} max={config.constraints.heightCm.max} step="0.1" inputMode="decimal" />
        </Field>
        {creating && <Field label="Starting weight (kg)" hint="Future weight changes use a check-in." error={errors.startingWeightKg || getServerFieldError(serverError, "startingWeightKg")}>
          <TextInput type="number" value={values.startingWeightKg} onChange={set("startingWeightKg")} min={config.constraints.weightKg.min} max={config.constraints.weightKg.max} step="0.1" inputMode="decimal" />
        </Field>}
        <Field label="Units">
          <SelectInput value={values.preferredUnitSystem} onChange={set("preferredUnitSystem")}><OptionList values={config.unitSystems} /></SelectInput>
        </Field>
        <Field label="Activity level" className={styles.fullWidth}>
          <SelectInput value={values.activityLevel} onChange={set("activityLevel")}><OptionList values={config.activityLevels} /></SelectInput>
        </Field>
      </div>
      <ChoiceGrid legend="Sex used for body calculations" value={values.sexForCalculation} values={config.sexForCalculation} onChange={(value) => setValues((current) => ({ ...current, sexForCalculation: value }))} descriptions={{ MALE: "Uses male calculation constants", FEMALE: "Uses female calculation constants" }} />
      {creating && <div>
        <Toggle label="I confirm I’m 18 or older" checked={values.adultConfirmed} onChange={(checked) => setValues((current) => ({ ...current, adultConfirmed: checked }))} />
        {errors.adultConfirmed && <span className={styles.fieldError}>{errors.adultConfirmed}</span>}
      </div>}
    </EditorShell>
  );
}

export function CoachingEditor({ profile, config, onClose, onSave, isSaving, serverError }) {
  const source = profile.coachingPreferences || {};
  const [values, setValues] = useState({
    coachingStyle: source.coachingStyle || "BALANCED",
    explanationLevel: source.explanationLevel || "NORMAL",
    motivationStyle: source.motivationStyle || "ENCOURAGING",
    checkinFrequency: source.checkinFrequency || "WEEKLY",
    proactiveCoaching: source.proactiveCoaching ?? false,
    workoutReminders: source.workoutReminders ?? false,
    nutritionReminders: source.nutritionReminders ?? false,
  });
  const submit = async (event) => { event.preventDefault(); await onSave("coaching", values, "Coach preferences updated"); };
  const setChoice = (field) => (value) => setValues((current) => ({ ...current, [field]: value }));
  const setToggle = (field) => (checked) => setValues((current) => ({ ...current, [field]: checked }));

  return (
    <EditorShell eyebrow="AI coach" title="Coach preferences" description="Choose how Spotter speaks, explains, and checks in. You can change this anytime." onClose={onClose} onSubmit={submit} isSaving={isSaving} serverError={serverError}>
      <ChoiceGrid legend="Coaching style" value={values.coachingStyle} values={config.coachingStyles} onChange={setChoice("coachingStyle")} descriptions={{ SUPPORTIVE: "Warm, patient guidance", BALANCED: "Encouragement with clear direction", DIRECT: "Straight to the point" }} />
      <ChoiceGrid legend="Explanation detail" value={values.explanationLevel} values={config.explanationLevels} onChange={setChoice("explanationLevel")} />
      <div className={styles.formGrid}>
        <Field label="Motivation style"><SelectInput value={values.motivationStyle} onChange={(event) => setChoice("motivationStyle")(event.target.value)}><OptionList values={config.motivationStyles} /></SelectInput></Field>
        <Field label="Check-in frequency"><SelectInput value={values.checkinFrequency} onChange={(event) => setChoice("checkinFrequency")(event.target.value)}><OptionList values={config.checkinFrequencies} /></SelectInput></Field>
      </div>
      <div className={styles.sectionBlock}>
        <Toggle label="Proactive coaching" description="Let Spotter initiate useful guidance." checked={values.proactiveCoaching} onChange={setToggle("proactiveCoaching")} />
        <Toggle label="Workout reminders" checked={values.workoutReminders} onChange={setToggle("workoutReminders")} />
        <Toggle label="Nutrition reminders" checked={values.nutritionReminders} onChange={setToggle("nutritionReminders")} />
      </div>
    </EditorShell>
  );
}
