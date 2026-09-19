import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageError from "../../components/ui/PageError.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { BitCharacter } from "../../components/landing/BitCharacter.jsx";
import { showSuccess } from "../../components/ui/Toast.jsx";
import { normalizeApiError } from "../../api/normalizeApiError.js";
import { useAuthStore } from "../../stores/authStore.js";
import {
  createBodyProfile,
  deleteBodyProfile,
  getMyProfile,
  getProfileConfig,
  replaceCoachingPreferences,
  replaceHealthProfile,
  replaceNutritionProfile,
  replaceTrainingProfile,
  updateAccountPreferences,
  updateBodyProfile,
  updatePublicProfile,
} from "../../features/profile/api/profile.api.js";
import {
  AccountPreferencesEditor,
  BodyProfileEditor,
  CoachingEditor,
  PublicProfileEditor,
} from "../../features/profile/components/ProfileEditors.jsx";
import {
  HealthEditor,
  NutritionEditor,
  TrainingEditor,
} from "../../features/profile/components/ProfileAdvancedEditors.jsx";
import {
  displayName,
  humanize,
  initials,
  localDate,
  PROFILE_CONFIG_QUERY_KEY,
  PROFILE_QUERY_KEY,
  PROFILE_TARGETS_QUERY_KEY,
  SECTION_LABELS,
} from "../../features/profile/profile.utils.js";
import CheckInDialog from "../../features/progress/components/CheckInDialog.jsx";
import { invalidateJourney } from "../../features/daily-summary/invalidation.js";
import styles from "./ProfilePage.module.css";

const ACTIONS = {
  public: updatePublicProfile,
  account: updateAccountPreferences,
  health: replaceHealthProfile,
  nutrition: replaceNutritionProfile,
  training: replaceTrainingProfile,
  coaching: replaceCoachingPreferences,
  deleteBody: deleteBodyProfile,
};

function Icon({ name }) {
  const paths = {
    public: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6" /></>,
    account: <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17M12 3c2.3 2.4 3.4 5.4 3.4 9S14.3 18.6 12 21c-2.3-2.4-3.4-5.4-3.4-9S9.7 5.4 12 3Z" /></>,
    body: <><path d="M8 4.5 12 3l4 1.5 2.5 5-2 2V21h-9v-9.5l-2-2 2.5-5Z" /><path d="M9.5 4.2c.4 1.6 1.2 2.3 2.5 2.3s2.1-.7 2.5-2.3" /></>,
    progress: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-3 3 2 5-6" /></>,
    health: <><path d="M12 20S4 15.5 4 9.2C4 6.3 6 4.5 8.5 4.5c1.5 0 2.8.8 3.5 2 .7-1.2 2-2 3.5-2C18 4.5 20 6.3 20 9.2 20 15.5 12 20 12 20Z" /><path d="M8 11h2l1-2 2 5 1-3h2" /></>,
    nutrition: <><path d="M7 3v7M4.5 3v4.5C4.5 9 5.5 10 7 10s2.5-1 2.5-2.5V3M7 10v11M16 3c-2 2-2.5 5.5-.5 8h2V3H16Zm1.5 8v10" /></>,
    training: <><path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12" /></>,
    coaching: <><path d="M6 18.5 3.5 21v-5A8 8 0 1 1 7 19" /><path d="M8 10h8M8 14h5" /></>,
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function ProfileSkeleton() {
  return <div className={styles.loading} aria-label="Loading profile"><Skeleton height="190px" borderRadius="24px" /><div className={styles.loadingGrid}>{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} height="160px" borderRadius="18px" />)}</div></div>;
}

function SectionCard({ section, title, summary, status, onOpen, disabled = false }) {
  return (
    <article className={`${styles.sectionCard} ${disabled ? styles.cardDisabled : ""}`} data-section={section}>
      <div className={styles.cardTop}>
        <span className={styles.iconWrap}><Icon name={section} /></span>
        <span className={styles.status}>{status}</span>
      </div>
      <div>
        <h2>{title}</h2>
        <p>{summary}</p>
      </div>
      <button type="button" onClick={onOpen} disabled={disabled} aria-label={`${disabled ? "Unavailable: " : "Edit "}${title}`}>
        {disabled ? "Set up body basics first" : "View & edit"}
        {!disabled && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>}
      </button>
    </article>
  );
}

function ProfileFact({ label, value, note, tone = "", onEdit, editLabel }) {
  return (
    <article className={`${styles.fact} ${tone ? styles[tone] : ""}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} aria-label={editLabel}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>
        </button>
      )}
    </article>
  );
}

function languageName(code) {
  if (!code) return "Not set";
  try {
    return new Intl.DisplayNames([code], { type: "language" }).of(code) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function regionName(code) {
  if (!code) return "Location not set";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [activeSection, setActiveSection] = useState(null);
  const [actionError, setActionError] = useState(null);
  const editorRef = useRef(null);
  const isSavingRef = useRef(false);
  const profileQuery = useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: getMyProfile });
  const configQuery = useQuery({ queryKey: PROFILE_CONFIG_QUERY_KEY, queryFn: getProfileConfig, staleTime: 60 * 60 * 1000 });
  const actionMutation = useMutation({
    mutationFn: async ({ section, payload }) => {
      if (section === "body") {
        return profileQuery.data.bodyProfile ? updateBodyProfile(payload) : createBodyProfile(payload);
      }
      return ACTIONS[section](payload);
    },
  });

  useEffect(() => { document.title = "Your profile — Spotter"; }, []);
  useEffect(() => { isSavingRef.current = actionMutation.isPending; }, [actionMutation.isPending]);
  useEffect(() => {
    const account = profileQuery.data?.account;
    if (!account?.onboardingStatus) return;
    updateUser({
      onboardingStatus: account.onboardingStatus,
      onboardingStep: account.onboardingStep,
    });
  }, [profileQuery.data?.account, updateUser]);
  useEffect(() => {
    if (!activeSection || activeSection === "progress") return undefined;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => editorRef.current?.focus());
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !isSavingRef.current) {
        setActionError(null);
        setActiveSection(null);
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeSection]);

  const openEditor = (section) => { setActionError(null); setActiveSection(section); };
  const closeEditor = () => { if (!actionMutation.isPending) { setActionError(null); setActiveSection(null); } };
  const save = async (section, payload, successMessage) => {
    setActionError(null);
    try {
      await actionMutation.mutateAsync({ section, payload });
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      await invalidateJourney(queryClient);
      if (section === "account" && payload?.timezone) {
        updateUser({ timezone: payload.timezone });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["meals"] }),
          queryClient.invalidateQueries({ queryKey: ["training"] }),
          queryClient.invalidateQueries({ queryKey: ["goals"] }),
        ]);
      }
      showSuccess(successMessage);
      setActiveSection(null);
      return true;
    } catch (error) {
      setActionError(normalizeApiError(error));
      return false;
    }
  };
  const removeBody = async (password) => save("deleteBody", { password }, "Fitness profile deleted");

  if (profileQuery.isLoading || configQuery.isLoading) return <ProfileSkeleton />;
  if (profileQuery.isError || configQuery.isError) {
    const error = normalizeApiError(profileQuery.error || configQuery.error);
    return <PageError title="Your profile couldn’t load" message={error.message} onRetry={() => { profileQuery.refetch(); configQuery.refetch(); }} />;
  }

  const profile = profileQuery.data;
  const config = configQuery.data;
  const body = profile.bodyProfile;
  const current = body?.currentBodyState;
  const health = body?.healthProfile;
  const nutrition = body?.nutritionProfile;
  const training = body?.trainingProfile;
  const coaching = profile.coachingPreferences;
  const language = languageName(profile.account.language);
  const location = profile.account.country
    ? regionName(profile.account.country)
    : profile.account.timezone || "Location not set";
  const sharedEditorProps = { profile, config, onClose: closeEditor, onSave: save, isSaving: actionMutation.isPending, serverError: actionError };

  const editors = {
    public: <PublicProfileEditor {...sharedEditorProps} />,
    account: <AccountPreferencesEditor {...sharedEditorProps} />,
    body: <BodyProfileEditor {...sharedEditorProps} onDelete={removeBody} />,
    health: <HealthEditor {...sharedEditorProps} />,
    nutrition: <NutritionEditor {...sharedEditorProps} />,
    training: <TrainingEditor {...sharedEditorProps} />,
    coaching: <CoachingEditor {...sharedEditorProps} />,
  };

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/app/home">Today</Link><span aria-hidden="true">/</span><span>Your profile</span></nav>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.brandLine}><i /> Spotter member profile</p>
          <div className={styles.identity}>
            {profile.userProfile?.profilePhotoUrl ? <img src={profile.userProfile.profilePhotoUrl} alt="" /> : <span className={styles.avatar} aria-hidden="true">{initials(profile)}</span>}
            <div>
              <span className={styles.handle}>@{profile.account.username}</span>
              <h1>{displayName(profile)}</h1>
              <p>{profile.userProfile?.bio || "Your real context, kept useful—not turned into paperwork."}</p>
            </div>
          </div>
          <button className={styles.editIdentity} type="button" onClick={() => openEditor("public")} aria-label="Edit Personal details">
            Edit my intro <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className={styles.mascotStage} aria-label="Bit, your Spotter guide">
          <span className={styles.mascotWord} aria-hidden="true">YOU</span>
          <div className={styles.mascot}><BitCharacter state="progress" decorative /></div>
          <div className={styles.mascotMessage}><small>Bit says</small><strong>Real context makes every move smarter.</strong></div>
          <button className={styles.checkinButton} type="button" onClick={() => body ? openEditor("progress") : openEditor("body")}>
            <span><Icon name="progress" /></span>
            <span><strong>{body ? "Add today’s check-in" : "Build my baseline"}</strong><small>{body ? "Weight first · extras optional" : "Start with the essentials"}</small></span>
          </button>
        </div>
      </header>

      <section className={styles.profileCanvas} aria-labelledby="profile-canvas-title">
        <div className={styles.canvasIntro}>
          <p className={styles.kicker}>Your context, at a glance</p>
          <h2 id="profile-canvas-title">The useful parts of you.</h2>
          <span>Scattered like real life. Tap any arrow to change the detail beside it.</span>
        </div>
        <ProfileFact label="Spotter speaks" value={language} note={location} tone="languageFact" onEdit={() => openEditor("account")} editLabel="Edit language and region" />
        <ProfileFact label="Right now" value={current?.weightKg ? `${current.weightKg} kg` : "No check-in yet"} note="Current weight" tone="weightFact" onEdit={() => body ? openEditor("progress") : openEditor("body")} editLabel={body ? "Add a progress check-in" : "Set up body basics"} />
        <ProfileFact label="Built from" value={body?.heightCm ? `${body.heightCm} cm` : "Not set"} note="Height baseline" tone="heightFact" onEdit={() => openEditor("body")} editLabel="Edit body basics" />
        <ProfileFact label="Daily rhythm" value={body ? humanize(body.activityLevel) : "Not set"} note="Activity level" tone="activityFact" onEdit={() => openEditor("body")} editLabel="Edit activity level" />
        <ProfileFact label="My units" value={body ? humanize(body.preferredUnitSystem) : "Not set"} note="How numbers appear" tone="unitsFact" onEdit={() => openEditor("body")} editLabel="Edit preferred units" />
        <ProfileFact label="Last seen" value={current ? localDate(current.recordedAt) : "Start today"} note="Latest progress check-in" tone="checkinFact" onEdit={() => body ? openEditor("progress") : openEditor("body")} editLabel="View progress check-ins" />
      </section>

      <div className={styles.workspace}>
        <section className={styles.sections} aria-labelledby="profile-layers-title">
          <div className={styles.sectionIntro}><div><p className={styles.kicker}>Go deeper only when it helps</p><h2 id="profile-layers-title">Shape how Spotter supports you.</h2></div><p>Your everyday details already live above. These layers are for the choices that genuinely change guidance.</p></div>
          <div className={styles.cardGrid}>
            <SectionCard section="health" title="Health & safety" summary={health ? (health.requiresProfessionalClearance ? "Marked for extra-care planning. Details stay private." : "Safety preferences have been reviewed.") : "Add only details that should change your plan."} status={health ? "Reviewed" : "Optional"} disabled={!body} onOpen={() => openEditor("health")} />
            <SectionCard section="nutrition" title="Food preferences" summary={nutrition ? `${humanize(nutrition.planStyle)} · ${nutrition.mealsPerDay ? `${nutrition.mealsPerDay} meals` : "Meal rhythm flexible"}` : "Shape meals around needs, time, and kitchen access."} status={nutrition ? "Personalized" : "Optional"} disabled={!body} onOpen={() => openEditor("nutrition")} />
            <SectionCard section="training" title="Training setup" summary={training ? `${humanize(training.overallExperienceLevel)} · ${training.trainingDaysPerWeek ?? "Flexible"} days/week` : "Set experience, real availability, and recovery."} status={training ? "Personalized" : "Optional"} disabled={!body} onOpen={() => openEditor("training")} />
            <SectionCard section="coaching" title="Coach preferences" summary={coaching ? `${humanize(coaching.coachingStyle)} · ${humanize(coaching.explanationLevel)} explanations` : "Choose the tone and detail that work for you."} status={coaching ? "Personalized" : "Optional"} onOpen={() => openEditor("coaching")} />
          </div>
        </section>
      </div>
      {activeSection === "progress" && <CheckInDialog onClose={() => setActiveSection(null)} />}
      {activeSection && activeSection !== "progress" && (
        <div className={styles.editorBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeEditor();
        }}>
          <aside className={styles.editorColumn} ref={editorRef} tabIndex="-1" aria-label={`${SECTION_LABELS[activeSection]} editor`}>
            {editors[activeSection]}
          </aside>
        </div>
      )}
    </div>
  );
}
