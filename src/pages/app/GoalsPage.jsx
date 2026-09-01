import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import PageError from "../../components/ui/PageError.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { BitCharacter } from "../../components/landing/BitCharacter.jsx";
import { showError, showSuccess } from "../../components/ui/Toast.jsx";
import { normalizeApiError } from "../../api/normalizeApiError.js";
import {
  ACTIVE_GOAL_QUERY_KEY,
  GOALS_QUERY_KEY,
  activateGoal,
  cancelGoal,
  completeGoal,
  createGoal,
  getActiveGoal,
  getGoals,
  updateGoal,
} from "../../features/goals/api/goals.api.js";
import {
  formatGoalDate,
  goalTargetCopy,
  goalTypeMeta,
  measurementLabel,
  partitionGoals,
} from "../../features/goals/goals.domain.js";
import GoalForm from "../../features/goals/components/GoalForm.jsx";
import GoalIcon from "../../features/goals/components/GoalIcon.jsx";
import GoalModal from "../../features/goals/components/GoalModal.jsx";
import styles from "./GoalsPage.module.css";

function GoalsSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Loading your goals" role="status">
      <Skeleton height="54px" width="46%" borderRadius="14px" />
      <Skeleton height="350px" borderRadius="28px" />
      <div className={styles.skeletonGrid}>
        <Skeleton height="220px" borderRadius="22px" />
        <Skeleton height="220px" borderRadius="22px" />
      </div>
    </div>
  );
}

function GoalBadge({ goal }) {
  const meta = goalTypeMeta(goal.goalType);
  return (
    <span className={styles.goalBadge}>
      <GoalIcon name={meta.icon} />
      {meta.label}
    </span>
  );
}

function ActiveGoal({ goal, onComplete, onCancel }) {
  const meta = goalTypeMeta(goal.goalType);
  const progress = goal.currentProgress;
  const currentWeight = progress?.weightKg;
  const hasWeightPath = currentWeight != null && goal.targetWeightKg != null;

  return (
    <section className={styles.activeSection} aria-labelledby="active-goal-heading">
      <div className={styles.activeBackdropWord} aria-hidden="true">MOVE</div>
      <div className={styles.activeTopline}>
        <span><i /> Your focus now</span>
        <span className={styles.locked}><GoalIcon name="lock" /> Active & locked in</span>
      </div>
      <div className={styles.activeBody}>
        <div className={styles.activeCopy}>
          <GoalBadge goal={goal} />
          <h2 id="active-goal-heading">{meta.label}<br/><em>is the move.</em></h2>
          <p>{meta.description} One check-in at a time—Bit’s keeping the destination in sight.</p>

          {hasWeightPath ? (
            <div className={styles.weightJourney} aria-label={`Current weight ${currentWeight} kilograms, target ${goal.targetWeightKg} kilograms`}>
              <div><span>Now</span><strong>{currentWeight}<small>kg</small></strong></div>
              <div className={styles.journeyLine}><GoalIcon name="arrow" /></div>
              <div><span>Destination</span><strong>{goal.targetWeightKg}<small>kg</small></strong></div>
            </div>
          ) : (
            <div className={styles.openJourney}>
              <GoalIcon name="flag" />
              <div><span>Your destination</span><strong>{goalTargetCopy(goal)}</strong></div>
            </div>
          )}

          <div className={styles.activeMeta}>
            <span><small>Started</small>{formatGoalDate(goal.startedAt, { short: true }) || "Just now"}</span>
            <span><small>Target date</small>{formatGoalDate(goal.targetDate, { short: true }) || "Open pace"}</span>
          </div>
        </div>
        <div className={styles.activeBit} aria-hidden="true">
          <span className={styles.bitSpark}><GoalIcon name="spark" /></span>
          <BitCharacter state="letsGo" decorative />
          <p>Let’s make<br/>this one count.</p>
        </div>
      </div>
      <div className={styles.activeActions}>
        <button type="button" className={styles.completeAction} onClick={() => onComplete(goal)}>
          <span><GoalIcon name="check" /></span>
          <span><strong>Complete goal</strong><small>Mark the moment</small></span>
          <GoalIcon name="arrow" />
        </button>
        <button type="button" className={styles.cancelTextAction} onClick={() => onCancel(goal)}>Cancel this goal</button>
      </div>
    </section>
  );
}

function NoActiveGoal({ hasDrafts, onCreate }) {
  return (
    <section className={styles.noActive} aria-labelledby="no-active-heading">
      <div className={styles.noActiveCopy}>
        <p className={styles.eyebrow}>Your next chapter</p>
        <h2 id="no-active-heading">What’s your<br/><em>next move?</em></h2>
        <p>{hasDrafts ? "You’ve already saved a few directions. Activate one below when it feels right, or sketch a new one." : "Choose a direction that feels like yours. Bit is ready when you are."}</p>
        <Button size="lg" onClick={onCreate}>Create a goal <GoalIcon name="arrow" /></Button>
      </div>
      <div className={styles.noActiveBit}><span>BIT IS WAITING <b>👀</b></span><BitCharacter state="idle" /></div>
    </section>
  );
}

function ProgressSnapshot({ activeGoal }) {
  if (!activeGoal) return null;
  const progress = activeGoal.currentProgress;

  if (!progress) {
    return (
      <section className={styles.progressEmpty} aria-labelledby="progress-heading">
        <div className={styles.progressEmptyBit}><BitCharacter state="progress" /></div>
        <div>
          <p className={styles.eyebrow}>Your first checkpoint</p>
          <h2 id="progress-heading">No check-in yet.</h2>
          <p>Give Spotter your first checkpoint and we’ll start connecting the dots.</p>
          <Link to="/app/profile">Record progress <GoalIcon name="arrow" /></Link>
        </div>
        <div className={styles.unfinishedPath} aria-hidden="true"><i/><i/><i/><i/></div>
      </section>
    );
  }

  const leadMetric = progress.weightKg != null
    ? { label: "Current weight", value: progress.weightKg, unit: "kg" }
    : progress.bodyFatPercentage != null
      ? { label: "Body fat", value: progress.bodyFatPercentage, unit: "%" }
      : progress.restingHeartRateBpm != null
        ? { label: "Resting heart rate", value: progress.restingHeartRateBpm, unit: "bpm" }
        : { label: "Latest checkpoint", value: "Logged", unit: "" };
  const supporting = [
    progress.bodyFatPercentage != null && { label: "Body fat", value: `${progress.bodyFatPercentage}%` },
    progress.skeletalMuscleMassKg != null && { label: "Muscle mass", value: `${progress.skeletalMuscleMassKg} kg` },
    progress.restingHeartRateBpm != null && { label: "Resting heart rate", value: `${progress.restingHeartRateBpm} bpm` },
  ].filter(Boolean).filter((metric) => metric.label !== leadMetric.label);

  return (
    <section className={styles.progressSection} aria-labelledby="progress-heading">
      <header className={styles.sectionHeader}>
        <div><p className={styles.eyebrow}>Current progress</p><h2 id="progress-heading">Your latest checkpoint</h2></div>
        <span>{formatGoalDate(progress.recordedAt, { short: true }) || "Recently recorded"}</span>
      </header>
      <div className={styles.progressBento}>
        <article className={styles.leadMetric}>
          <span>{leadMetric.label}</span>
          <strong>{leadMetric.value}<small>{leadMetric.unit}</small></strong>
          <p>You’re closer than yesterday.</p>
          <i aria-hidden="true" />
        </article>
        <div className={styles.supportMetrics}>
          {supporting.length ? supporting.map((metric) => (
            <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>
          )) : <article><span>Momentum</span><strong>Checkpoint saved</strong></article>}
        </div>
        <article className={styles.measurements}>
          <span>Latest measurements</span>
          {progress.measurements?.length ? (
            <ul>{progress.measurements.map((measurement) => <li key={measurement.measurementType}><span>{measurementLabel(measurement.measurementType)}</span><strong>{measurement.valueCm} cm</strong></li>)}</ul>
          ) : <p>No measurements in this check-in—and that’s completely fine.</p>}
        </article>
      </div>
    </section>
  );
}

function DraftCard({ goal, onEdit, onActivate, onCancel, isActivating }) {
  const meta = goalTypeMeta(goal.goalType);
  return (
    <article className={styles.draftCard}>
      <div className={styles.draftTop}>
        <span className={styles.draftIcon}><GoalIcon name={meta.icon} /></span>
        <span>Saved idea</span>
      </div>
      <div className={styles.draftCopy}>
        <h3>{meta.label}</h3>
        <p>{goalTargetCopy(goal)}</p>
        <span>{goal.targetDate ? `Aim for ${formatGoalDate(goal.targetDate, { short: true })}` : "No deadline. Your pace."}</span>
      </div>
      <div className={styles.draftActions}>
        <Button size="sm" onClick={() => onActivate(goal)} isLoading={isActivating}>Make active</Button>
        <button type="button" onClick={() => onEdit(goal)}><GoalIcon name="edit" /> Edit</button>
        <button type="button" className={styles.draftCancel} onClick={() => onCancel(goal)}>Cancel</button>
      </div>
    </article>
  );
}

function Drafts({ drafts, onCreate, onEdit, onActivate, onCancel, activatingId }) {
  return (
    <section className={styles.draftsSection} aria-labelledby="drafts-heading">
      <header className={styles.sectionHeader}>
        <div><p className={styles.eyebrow}>Ideas for what’s next</p><h2 id="drafts-heading">Saved goals</h2></div>
        <button type="button" onClick={onCreate}>New direction <span>+</span></button>
      </header>
      {drafts.length ? (
        <div className={styles.draftGrid}>{drafts.map((goal) => <DraftCard key={goal.id} goal={goal} onEdit={onEdit} onActivate={onActivate} onCancel={onCancel} isActivating={activatingId === goal.id} />)}</div>
      ) : (
        <div className={styles.noDrafts}><span><GoalIcon name="spark" /></span><div><h3>Nothing waiting in the wings.</h3><p>Save an idea now and activate it only when you’re ready.</p></div><button type="button" onClick={onCreate}>Sketch a goal</button></div>
      )}
    </section>
  );
}

function Journey({ history }) {
  if (!history.length) return null;
  return (
    <section className={styles.journeySection} aria-labelledby="journey-heading">
      <header className={styles.sectionHeader}><div><p className={styles.eyebrow}>Every step belongs</p><h2 id="journey-heading">Your journey</h2></div><span>{history.length} {history.length === 1 ? "chapter" : "chapters"}</span></header>
      <ol className={styles.timeline}>
        {history.map((goal) => {
          const completed = goal.status === "COMPLETED";
          const meta = goalTypeMeta(goal.goalType);
          return (
            <li key={goal.id} className={completed ? styles.completed : styles.cancelled}>
              <span className={styles.timelineMark}><GoalIcon name={completed ? "check" : "close"} /></span>
              <div><span>{formatGoalDate(goal.completedAt || goal.cancelledAt || goal.updatedAt, { short: true })}</span><h3>{meta.label}</h3><p>{goalTargetCopy(goal)}</p></div>
              <strong>{completed ? "Completed" : "Closed chapter"}</strong>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ConfirmGoal({ goal, action, onConfirm, onClose, pending }) {
  const meta = goalTypeMeta(goal.goalType);
  const completing = action === "complete";
  return (
    <GoalModal eyebrow={completing ? "A milestone worth marking" : "A change of direction"} title={completing ? "Complete this goal?" : "Cancel this goal?"} onClose={onClose}>
      <div className={styles.confirmGoal}>
        <span className={completing ? styles.confirmPositive : styles.confirmQuiet}><GoalIcon name={completing ? "flag" : meta.icon} /></span>
        <div><strong>{meta.label}</strong><p>{goalTargetCopy(goal)}</p></div>
      </div>
      <p className={styles.confirmCopy}>{completing ? "This will add the goal to your journey as an achievement and free the way for what’s next." : "This goal will stay in your journey history, but you won’t be able to resume or edit it."}</p>
      <div className={styles.confirmActions}>
        <Button variant="ghost" onClick={onClose}>Keep goal</Button>
        <Button variant={completing ? "primary" : "danger"} onClick={onConfirm} isLoading={pending}>{completing ? "Yes, complete it" : "Cancel goal"}</Button>
      </div>
    </GoalModal>
  );
}

function ActivationConflict({ activeGoal, draft, onClose }) {
  return (
    <GoalModal eyebrow="Your goal is safely saved" title="One focus at a time." onClose={onClose}>
      <div className={styles.conflict}>
        <div className={styles.conflictBit}><BitCharacter state="thinking" /></div>
        <p>You already have an active goal. <strong>{goalTypeMeta(draft.goalType).label}</strong> is still waiting safely in your saved goals—nothing was lost.</p>
        {activeGoal && <div className={styles.currentGoalMini}><span>Active now</span><strong>{goalTypeMeta(activeGoal.goalType).label}</strong><small>{goalTargetCopy(activeGoal)}</small></div>}
        <div className={styles.confirmActions}><Button variant="ghost" onClick={onClose}>Keep draft for later</Button><Button onClick={() => { onClose(); document.getElementById("active-goal-heading")?.scrollIntoView({ behavior: "smooth" }); }}>View active goal</Button></div>
      </div>
    </GoalModal>
  );
}

function Celebration({ goal, onClose }) {
  return (
    <GoalModal eyebrow="Goal complete" title="You made this one count." onClose={onClose}>
      <div className={styles.celebration}>
        <div className={styles.celebrationGlow} aria-hidden="true" />
        <div className={styles.celebrationBit}><BitCharacter state="victory" /></div>
        <h3>{goalTypeMeta(goal.goalType).label}</h3>
        <p>That chapter is officially part of your journey. Take the win—you earned it.</p>
        <Button onClick={onClose}>See what’s next <GoalIcon name="arrow" /></Button>
      </div>
    </GoalModal>
  );
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editorError, setEditorError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [conflictDraft, setConflictDraft] = useState(null);
  const [celebratedGoal, setCelebratedGoal] = useState(null);
  const activeQuery = useQuery({ queryKey: ACTIVE_GOAL_QUERY_KEY, queryFn: getActiveGoal });
  const goalsQuery = useQuery({ queryKey: GOALS_QUERY_KEY, queryFn: getGoals });
  const { drafts, history } = partitionGoals(goalsQuery.data);

  useEffect(() => { document.title = "Goals — Spotter"; }, []);

  async function refreshGoals() {
    await queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
  }

  function lifecycleError(error, goal) {
    const normalized = normalizeApiError(error);
    if (normalized.code === "ACTIVE_GOAL_EXISTS") {
      setConflictDraft(goal);
      return;
    }
    if (normalized.code === "INVALID_GOAL_STATE") {
      refreshGoals();
      showError("That goal changed while you were here. We refreshed your journey.");
      return;
    }
    if (normalized.code === "GOAL_NOT_FOUND") {
      refreshGoals();
      showError("That goal is no longer available. Your journey is up to date.");
      return;
    }
    showError(normalized.code === "DATABASE_ERROR" ? "Spotter hit a snag. Please try that again." : normalized.message);
  }

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: async () => { await refreshGoals(); setCreating(false); setEditorError(null); showSuccess("Goal saved. Activate it whenever you’re ready."); },
    onError: (error) => setEditorError(normalizeApiError(error)),
  });
  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateGoal(id, payload),
    onSuccess: async () => { await refreshGoals(); setEditingGoal(null); setEditorError(null); showSuccess("Saved goal updated."); },
    onError: (error) => setEditorError(normalizeApiError(error)),
  });
  const activateMutation = useMutation({
    mutationFn: (goal) => activateGoal(goal.id),
    onSuccess: async () => { await refreshGoals(); showSuccess("Goal activated. Let’s go."); window.scrollTo({ top: 0, behavior: "smooth" }); },
    onError: lifecycleError,
  });
  const completeMutation = useMutation({
    mutationFn: (goal) => completeGoal(goal.id),
    onSuccess: async (goal) => { await refreshGoals(); setConfirming(null); setCelebratedGoal(goal); },
    onError: (error, goal) => { setConfirming(null); lifecycleError(error, goal); },
  });
  const cancelMutation = useMutation({
    mutationFn: (goal) => cancelGoal(goal.id),
    onSuccess: async () => { await refreshGoals(); setConfirming(null); showSuccess("Goal kept in your journey as a closed chapter."); },
    onError: (error, goal) => { setConfirming(null); lifecycleError(error, goal); },
  });

  if (activeQuery.isLoading || goalsQuery.isLoading) return <GoalsSkeleton />;
  if (activeQuery.isError || goalsQuery.isError) {
    const error = normalizeApiError(activeQuery.error || goalsQuery.error);
    return <PageError title="Your goals need a moment" message={error.code === "DATABASE_ERROR" ? "Spotter couldn’t load your journey just now." : error.message} onRetry={() => Promise.all([activeQuery.refetch(), goalsQuery.refetch()])} />;
  }

  const activeGoal = activeQuery.data;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>Your journey · your move</p><h1>Goals that move<br/><em>with you.</em></h1></div>
        <button type="button" className={styles.newGoalButton} onClick={() => { setEditorError(null); setCreating(true); }}><span>+</span> New goal</button>
      </header>

      {activeGoal ? <ActiveGoal goal={activeGoal} onComplete={(goal) => setConfirming({ action: "complete", goal })} onCancel={(goal) => setConfirming({ action: "cancel", goal })} /> : <NoActiveGoal hasDrafts={drafts.length > 0} onCreate={() => { setEditorError(null); setCreating(true); }} />}
      <ProgressSnapshot activeGoal={activeGoal} />
      <Drafts drafts={drafts} onCreate={() => { setEditorError(null); setCreating(true); }} onEdit={(goal) => { setEditorError(null); setEditingGoal(goal); }} onActivate={(goal) => activateMutation.mutate(goal)} onCancel={(goal) => setConfirming({ action: "cancel", goal })} activatingId={activateMutation.isPending ? activateMutation.variables?.id : null} />
      <Journey history={history} />

      {creating && <GoalModal eyebrow="A new direction" title="Choose your next move" onClose={() => !createMutation.isPending && setCreating(false)} wide><GoalForm onSubmit={(payload) => createMutation.mutate(payload)} onCancel={() => setCreating(false)} apiError={editorError} isSaving={createMutation.isPending} /></GoalModal>}
      {editingGoal && <GoalModal eyebrow="Saved goal" title="Fine-tune your direction" onClose={() => !editMutation.isPending && setEditingGoal(null)} wide><GoalForm initialGoal={editingGoal} onSubmit={(payload) => editMutation.mutate({ id: editingGoal.id, payload })} onCancel={() => setEditingGoal(null)} apiError={editorError} isSaving={editMutation.isPending} /></GoalModal>}
      {confirming && <ConfirmGoal goal={confirming.goal} action={confirming.action} onClose={() => setConfirming(null)} onConfirm={() => confirming.action === "complete" ? completeMutation.mutate(confirming.goal) : cancelMutation.mutate(confirming.goal)} pending={completeMutation.isPending || cancelMutation.isPending} />}
      {conflictDraft && <ActivationConflict activeGoal={activeGoal} draft={conflictDraft} onClose={() => setConflictDraft(null)} />}
      {celebratedGoal && <Celebration goal={celebratedGoal} onClose={() => setCelebratedGoal(null)} />}
    </div>
  );
}
