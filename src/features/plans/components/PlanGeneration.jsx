import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import s from '../Plans.module.css';
import { usePlanContext, useGeneratePlan } from '../usePlans.js';
import {
  isReadinessBlocked,
  isReadinessReady,
  readinessMissingRequired,
  readinessMissingOptional,
  readinessCodeInfo,
  readinessEditorType,
  formatCalories,
  formatNutrient,
  nutritionPlanStyleLabel,
} from '../plans.domain.js';
import { BitCharacter } from '../../../components/landing/BitCharacter.jsx';
import { showSuccess } from '../../../components/ui/Toast.jsx';
import { normalizeApiError } from '../../../api/normalizeApiError.js';
import { useAuthStore } from '../../../stores/authStore.js';
import {
  getMyProfile,
  getProfileConfig,
  updateAccountPreferences,
  replaceHealthProfile,
  replaceNutritionProfile,
  replaceTrainingProfile,
  updateBodyProfile,
  createBodyProfile,
} from '../../profile/api/profile.api.js';
import {
  PROFILE_QUERY_KEY,
  PROFILE_CONFIG_QUERY_KEY,
} from '../../profile/profile.utils.js';
import {
  HealthEditor,
  NutritionEditor,
  TrainingEditor,
} from '../../profile/components/ProfileAdvancedEditors.jsx';
import {
  AccountPreferencesEditor,
  BodyProfileEditor,
} from '../../profile/components/ProfileEditors.jsx';
import CheckInDialog from '../../progress/components/CheckInDialog.jsx';
import GoalModal from '../../goals/components/GoalModal.jsx';
import GoalForm from '../../goals/components/GoalForm.jsx';
import {
  createGoal,
  GOALS_QUERY_KEY,
  ACTIVE_GOAL_QUERY_KEY,
} from '../../goals/api/goals.api.js';

const ACTIONS = {
  account: updateAccountPreferences,
  health: replaceHealthProfile,
  nutrition: replaceNutritionProfile,
  training: replaceTrainingProfile,
};

/**
 * PlanGeneration — Three-step flow: Readiness → Date selection → Generation waiting.
 *
 * Missing readiness items can be answered directly inline on this page via focused
 * modal drawers, without forcing the user to navigate away to the profile page.
 */
export default function PlanGeneration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const context = usePlanContext();
  const generate = useGeneratePlan();

  const [activeEditor, setActiveEditor] = useState(null); // 'health' | 'training' | 'nutrition' | 'body' | 'account' | 'checkIn' | 'goal' | null
  const [actionError, setActionError] = useState(null);

  const profileQuery = useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: getMyProfile });
  const configQuery = useQuery({ queryKey: PROFILE_CONFIG_QUERY_KEY, queryFn: getProfileConfig, staleTime: 60 * 60 * 1000 });

  const actionMutation = useMutation({
    mutationFn: async ({ section, payload }) => {
      if (section === 'body') {
        return profileQuery.data?.bodyProfile ? updateBodyProfile(payload) : createBodyProfile(payload);
      }
      return ACTIONS[section](payload);
    },
  });

  // TODO: Remove this guard once plan generation is live
  const isServiceLocked = true;

  const [dates] = useState(() => {
    const now = new Date();
    const start = now.toISOString().slice(0, 10);
    const endD = new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000);
    const end = endD.toISOString().slice(0, 10);
    return { start, end };
  });
  const [step, setStep] = useState('readiness'); // 'readiness' | 'dates' | 'generating'
  const [startDate, setStartDate] = useState(dates.start);
  const [endDate, setEndDate] = useState(dates.end);
  const [dateError, setDateError] = useState('');

  useEffect(() => { document.title = 'New Plan — Spotter'; }, []);

  useEffect(() => {
    if (!activeEditor) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [activeEditor]);

  const handleSave = async (section, payload, successMessage) => {
    setActionError(null);
    try {
      await actionMutation.mutateAsync({ section, payload });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['plans'] }),
      ]);
      await context.refetch();
      if (section === 'account' && payload?.timezone) {
        updateUser({ timezone: payload.timezone });
      }
      showSuccess(successMessage || 'Preferences updated');
      setActiveEditor(null);
      return true;
    } catch (error) {
      setActionError(normalizeApiError(error));
      return false;
    }
  };

  const handleGoalSubmit = async (payload) => {
    setActionError(null);
    try {
      await createGoal(payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ACTIVE_GOAL_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['plans'] }),
      ]);
      await context.refetch();
      showSuccess('Goal created');
      setActiveEditor(null);
    } catch (error) {
      setActionError(normalizeApiError(error));
    }
  };

  const openEditor = (type) => {
    setActionError(null);
    setActiveEditor(type);
  };

  // ── Readiness step ─────────────────────────────────────
  if (step === 'readiness') {
    if (context.isPending) return <div className={`${s.page} ${s.genPage}`}><Loading /></div>;
    if (context.isError) return (
      <div className={`${s.page} ${s.genPage}`}>
        <PageHeader />
        <div className={s.error} role="alert">
          <p>Couldn't load your plan readiness. Please try again.</p>
          <button type="button" className={`${s.button} ${s.secondary}`} onClick={() => context.refetch()}>Try again</button>
        </div>
      </div>
    );

    const data = context.data;
    const blocked = isReadinessBlocked(data);
    const ready = isReadinessReady(data);
    const missingRequired = readinessMissingRequired(data);
    const missingOptional = readinessMissingOptional(data);

    if (blocked) {
      return (
        <div className={`${s.page} ${s.genPage}`}>
          <PageHeader />
          <div className={s.blocked}>
            <BitCharacter state="thinking" decorative />
            <h2>Not quite ready yet</h2>
            <p>
              {data.blockReason === 'PROFESSIONAL_CLEARANCE_REQUIRED'
                ? 'Based on your health profile, we recommend consulting a professional before generating a training and nutrition plan.'
                : "There's something we need to sort out before creating your plan."}
            </p>
            <Link to="/app/profile" className={`${s.button} ${s.secondary}`}>Go to profile</Link>
          </div>
        </div>
      );
    }

    return (
      <div className={`${s.page} ${s.genPage}`}>
        <PageHeader />

        {/* TODO: Remove this guard once plan generation is live */}
        {isServiceLocked && <ComingSoonBanner />}


        {/* Missing required — action cards */}
        {missingRequired.length > 0 && (
          <div className={s.genSection}>
            <div className={s.genSectionHeader}>
              <span className={s.genSectionBadge} data-variant="required">
                {missingRequired.length} required
              </span>
              <h2 className={s.genSectionTitle}>
                Before we can build your plan
              </h2>
              <p className={s.genSectionSub}>
                Answer these directly below so Spotter can personalize your training and nutrition.
              </p>
            </div>
            <div className={s.readinessCards}>
              {missingRequired.map((code) => {
                const info = readinessCodeInfo(code);
                return (
                  <ReadinessCard
                    key={code}
                    code={code}
                    info={info}
                    required
                    onOpen={openEditor}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Missing optional — softer cards */}
        {missingOptional.length > 0 && (
          <div className={s.genSection}>
            <div className={s.genSectionHeader}>
              <span className={s.genSectionBadge} data-variant="optional">
                Optional
              </span>
              <h2 className={s.genSectionTitle}>
                Makes your plan even better
              </h2>
              <p className={s.genSectionSub}>
                These aren't required, but they help Spotter personalise your meals and experience.
              </p>
            </div>
            <div className={s.readinessCards}>
              {missingOptional.map((code) => {
                const info = readinessCodeInfo(code);
                return (
                  <ReadinessCard
                    key={code}
                    code={code}
                    info={info}
                    required={false}
                    onOpen={openEditor}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Target preview — shown only when ready or close to ready */}
        {ready && data?.targets && (
          <div className={s.genCard}>
            <p className={s.eyebrow}>YOUR TARGETS</p>
            <div className={s.targetPreview}>
              {data.targets.calories != null && (
                <div className={s.targetCell}>
                  <strong>{formatCalories(data.targets.calories)}</strong>
                  <span>Calories</span>
                </div>
              )}
              {data.targets.proteinGrams != null && (
                <div className={s.targetCell}>
                  <strong>{formatNutrient(data.targets.proteinGrams)}</strong>
                  <span>Protein</span>
                </div>
              )}
              {data.targets.carbsGrams != null && (
                <div className={s.targetCell}>
                  <strong>{formatNutrient(data.targets.carbsGrams)}</strong>
                  <span>Carbs</span>
                </div>
              )}
              {data.targets.fatGrams != null && (
                <div className={s.targetCell}>
                  <strong>{formatNutrient(data.targets.fatGrams)}</strong>
                  <span>Fat</span>
                </div>
              )}
            </div>
            {data.nutritionPlanStyle && (
              <p className={s.muted}>Style: {nutritionPlanStyleLabel(data.nutritionPlanStyle)}</p>
            )}
          </div>
        )}

        {/* TODO: Remove isServiceLocked guard once plan generation is live */}
        <button
          type="button"
          className={`${s.button} ${ready && !isServiceLocked ? s.coral : s.primary}`}
          disabled={!ready || missingRequired.length > 0 || isServiceLocked}
          onClick={() => setStep('dates')}
          style={{ width: '100%' }}
        >
          {isServiceLocked
            ? 'Coming Soon'
            : ready
              ? 'Choose dates'
              : `Answer ${missingRequired.length} required question${missingRequired.length !== 1 ? 's' : ''} to continue`}
        </button>

        {/* Inline Drawer Modal Editors */}
        {activeEditor && activeEditor !== 'checkIn' && activeEditor !== 'goal' && (
          <div
            className={s.editorBackdrop}
            onClick={() => !actionMutation.isPending && setActiveEditor(null)}
          >
            <div
              className={s.editorColumn}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
            >
              {activeEditor === 'health' && (
                <HealthEditor
                  profile={profileQuery.data || {}}
                  config={configQuery.data || {}}
                  onClose={() => setActiveEditor(null)}
                  onSave={handleSave}
                  isSaving={actionMutation.isPending}
                  serverError={actionError}
                />
              )}
              {activeEditor === 'training' && (
                <TrainingEditor
                  profile={profileQuery.data || {}}
                  config={configQuery.data || {}}
                  onClose={() => setActiveEditor(null)}
                  onSave={handleSave}
                  isSaving={actionMutation.isPending}
                  serverError={actionError}
                />
              )}
              {activeEditor === 'nutrition' && (
                <NutritionEditor
                  profile={profileQuery.data || {}}
                  config={configQuery.data || {}}
                  onClose={() => setActiveEditor(null)}
                  onSave={handleSave}
                  isSaving={actionMutation.isPending}
                  serverError={actionError}
                />
              )}
              {activeEditor === 'body' && (
                <BodyProfileEditor
                  profile={profileQuery.data || {}}
                  config={configQuery.data || {}}
                  onClose={() => setActiveEditor(null)}
                  onSave={handleSave}
                  isSaving={actionMutation.isPending}
                  serverError={actionError}
                />
              )}
              {activeEditor === 'account' && (
                <AccountPreferencesEditor
                  profile={profileQuery.data || {}}
                  config={configQuery.data || {}}
                  onClose={() => setActiveEditor(null)}
                  onSave={handleSave}
                  isSaving={actionMutation.isPending}
                  serverError={actionError}
                />
              )}
            </div>
          </div>
        )}

        {activeEditor === 'checkIn' && (
          <CheckInDialog
            onClose={() => {
              setActiveEditor(null);
              context.refetch();
            }}
          />
        )}

        {activeEditor === 'goal' && (
          <GoalModal
            eyebrow="A new direction"
            title="Choose your fitness goal"
            onClose={() => setActiveEditor(null)}
            wide
          >
            <GoalForm
              onSubmit={handleGoalSubmit}
              onCancel={() => setActiveEditor(null)}
              apiError={actionError}
              isSaving={false}
            />
          </GoalModal>
        )}
      </div>
    );
  }

  // ── Date selection step ─────────────────────────────────
  if (step === 'dates') {
    function handleGenerate(e) {
      e.preventDefault();
      if (!startDate || !endDate) { setDateError('Choose a start and end date.'); return; }
      if (endDate < startDate) { setDateError('End date must be on or after the start date.'); return; }
      setDateError('');
      setStep('generating');
      generate.mutate(
        { startDate, endDate },
        {
          onSuccess: (result) => {
            const plan = result?.data;
            if (plan?.id) navigate(`/app/plans/${plan.id}`, { replace: true });
            else navigate('/app/plans', { replace: true });
          },
          onError: (err) => {
            // TODO: Remove this guard once plan generation is live
            if (err.status === 503) {
              // Stay on dates step — the error banner will show the friendly message
              return;
            }
            if (err.code === 'PLAN_CONTEXT_INCOMPLETE' || err.status === 422) {
              context.refetch();
            }
          },
        }
      );
    }

    return (
      <div className={`${s.page} ${s.genPage}`}>
        <PageHeader onBack={() => setStep('readiness')} />
        <form className={s.genStep} onSubmit={handleGenerate}>
          <div className={s.genCard}>
            <h3>When should your plan run?</h3>
            <p className={s.muted}>Spotter will create a personalized weekly schedule that repeats throughout this period.</p>
            <div className={s.dateFields} style={{ marginTop: '1rem' }}>
              <label className={s.field}>
                <span>Start date</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-invalid={!!dateError} />
              </label>
              <label className={s.field}>
                <span>End date</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={!!dateError} />
              </label>
            </div>
            {dateError && <p className={s.fieldError} role="alert">{dateError}</p>}
          </div>

          {generate.isError && (
            <div className={s.error} role="alert">
              <p>{generationErrorMessage(generate.error)}</p>
            </div>
          )}

          {/* TODO: Remove this guard once plan generation is live */}
          <button
            type="submit"
            className={`${s.button} ${s.coral}`}
            style={{ width: '100%' }}
            disabled={generate.isPending || generate.error?.status === 503}
          >
            {generate.error?.status === 503 ? 'Coming Soon' : 'Generate plan'}
            {generate.error?.status !== 503 && <ArrowIcon />}
          </button>
        </form>
      </div>
    );
  }

  // ── Generation waiting step ─────────────────────────────
  if (step === 'generating') {
    const isErr = generate.isError;
    const is503 = generate.error?.status === 503;
    const isContextIncomplete = generate.error?.code === 'PLAN_CONTEXT_INCOMPLETE' || generate.error?.status === 422;

    // TODO: Remove this 503 branch once plan generation is live
    if (is503) {
      return (
        <div className={`${s.page} ${s.genPage}`}>
          <div className={s.genWaiting}>
            <BitCharacter state="thinking" decorative />
            <h2>Coming Soon</h2>
            <p>Plan generation is currently under testing and development. This feature will be available soon.</p>
            <button
              type="button"
              className={`${s.button} ${s.secondary}`}
              onClick={() => setStep('readiness')}
            >
              <BackIcon /> Go back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`${s.page} ${s.genPage}`}>
        <div className={s.genWaiting}>
          <BitCharacter state={isErr ? 'thinking' : 'aiCoach'} decorative />
          {!isErr && <span className={s.pulseRing} />}
          <h2>{isErr ? "Couldn't generate plan" : 'Creating your plan…'}</h2>
          <p>
            {isErr
              ? generationErrorMessage(generate.error)
              : 'Spotter is building your training and nutrition schedule. This may take a moment.'}
          </p>

          {isErr && (
            <div className={s.error} role="alert" style={{ width: '100%', maxWidth: 440 }}>
              <p>{generationErrorMessage(generate.error)}</p>
              <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center', marginTop: '.8rem', flexWrap: 'wrap' }}>
                {isContextIncomplete ? (
                  <button
                    type="button"
                    className={`${s.button} ${s.primary}`}
                    onClick={() => {
                      context.refetch();
                      setStep('readiness');
                    }}
                  >
                    Review missing items
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${s.button} ${s.primary}`}
                    onClick={() => setStep('dates')}
                  >
                    Try again
                  </button>
                )}
                <Link to="/app/plans" className={`${s.button} ${s.secondary}`}>
                  Check your drafts
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/* ── ReadinessCard ─────────────────────────────────────────── */

function ReadinessCard({ info, code, required, onOpen }) {
  const editorType = readinessEditorType(code);

  const handleClick = (e) => {
    e.preventDefault();
    if (editorType && onOpen) {
      onOpen(editorType);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
      className={`${s.readinessCard} ${required ? s.readinessCardRequired : s.readinessCardOptional}`}
      style={{ cursor: 'pointer' }}
    >
      <span className={s.readinessCardIcon} data-icon={info.icon}>
        <ReadinessIcon name={info.icon} />
      </span>
      <div className={s.readinessCardBody}>
        <strong className={s.readinessCardLabel}>{info.label}</strong>
        <p className={s.readinessCardDesc}>{info.description}</p>
      </div>
      <span className={s.readinessCardCta} aria-hidden="true">
        Answer now <ArrowIcon />
      </span>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function PageHeader({ onBack }) {
  return (
    <header className={s.pageHeader}>
      <div>
        <p className={s.eyebrow}>NEW PLAN</p>
        <h1>Create<span>.</span></h1>
      </div>
      {onBack && (
        <button type="button" className={s.textLink} onClick={onBack}>
          <BackIcon /> Back
        </button>
      )}
    </header>
  );
}

function Loading() {
  return <div className={s.skeletons} role="status" aria-label="Loading"><div className={s.skeleton} style={{ height: 200 }} /><div className={s.skeleton} /><div className={s.skeleton} /></div>;
}

// TODO: Remove this component once plan generation is live
function ComingSoonBanner() {
  return (
    <div className={s.comingSoonBanner}>
      <BitCharacter state="thinking" decorative />
      <div className={s.comingSoonBannerContent}>
        <span className={s.comingSoonBadge}>In Development</span>
        <h3>Plan generation is coming soon</h3>
        <p>
          We're fine-tuning the AI that builds your personalised training and nutrition plans.
          This feature will be available shortly — stay tuned!
        </p>
      </div>
    </div>
  );
}

function generationErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';
  // TODO: Remove this guard once plan generation is live
  if (error.status === 503) {
    return 'Plan generation is currently under testing and development. This feature will be available soon.';
  }
  if (error.code === 'TOO_MANY_REQUESTS' || error.code === 'AI_PROVIDER_RATE_LIMITED') {
    return 'The AI service is temporarily busy. Please wait a moment before trying again.';
  }
  if (error.code === 'AI_PROVIDER_TIMEOUT') {
    return 'We lost track of the request. Check your drafts before trying again — your plan may have been created.';
  }
  if (error.code?.startsWith('AI_PROVIDER_') || error.code === 'PLAN_GENERATION_FAILED') {
    return "Plan generation didn't complete this time. Your active plan is unchanged. Please try again.";
  }
  if (error.code === 'PLAN_CONTEXT_INCOMPLETE' || error.status === 422) {
    return error.message || 'Your profile has missing requirements or schedule conflicts that need to be resolved.';
  }
  if (error.code === 'PLAN_NOT_ELIGIBLE') {
    return 'Plan generation is blocked by your health eligibility settings. Please review your profile.';
  }
  if (error.code === 'PLAN_CONTENT_INVALID') {
    return "The generated plan couldn't satisfy your configured training or nutrition constraints. Please check your preferences and try again.";
  }
  if (error.code === 'PLAN_CONTEXT_CHANGED') {
    return 'Your profile has changed since this was started. Please generate a fresh plan.';
  }
  return error.message || 'Something went wrong. Please try again.';
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>;
}

function ReadinessIcon({ name }) {
  const icons = {
    target:   <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="m15.5 8.5 4-4m-1 0h1v1"/></>,
    person:   <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>,
    heart:    <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    dumbbell: <><path d="m7 7 10 10M3 7l4-4m10 18 4-4M4 10l6-6m4 16 6-6"/></>,
    meals:    <><path d="M3 11h18"/><path d="M5 7l1 4"/><path d="M19 7l-1 4"/><path d="M12 4v3"/><path d="M5 11c0 5 3 8 7 8s7-3 7-8"/></>,
    clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
    scale:    <><path d="M12 3v19M5 9l7-6 7 6"/><path d="M3 19h18"/><path d="M5 19c0-3.9 3.1-7 7-7s7 3.1 7 7"/></>,
    warning:  <><path d="m10.29 3.86-8.6 14.86A2 2 0 0 0 3.42 21h17.16a2 2 0 0 0 1.73-2.98L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name] ?? icons.person}</svg>;
}
