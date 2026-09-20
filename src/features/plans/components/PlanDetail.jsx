import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import s from '../Plans.module.css';
import { usePlanDetail, useStartFromPlan } from '../usePlans.js';
import {
  planTitle,
  formatPlanDateRange,
  todayInPlanTimezone,
  sortPlanDays,
  dayIndex,
  weekDayShort,
  weekDayLabel,
} from '../plans.domain.js';
import { useAuthStore } from '../../../stores/authStore.js';
import PlanStatusBadge from './PlanStatusBadge.jsx';
import PlanDay from './PlanDay.jsx';
import ActivationDialog from './ActivationDialog.jsx';
import EndPlanDialog from './EndPlanDialog.jsx';
import DiscardDialog from './DiscardDialog.jsx';
import pointingBit from '../../../assets/identity/02_pointing/WEBP/02_pointing_768x1024.webp';

/**
 * PlanDetail — Full plan view.
 *
 * DRAFT: "Here's your week" + Activate / Discard.
 * ACTIVE: "This is your plan" + End Plan.
 * Week navigator: Mon–Sun pill selector, day content via PlanDay.
 */
export default function PlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const plan = usePlanDetail(planId);
  const startFromPlan = useStartFromPlan();
  const timezone = useAuthStore((s) => s.user?.timezone);

  const [dialog, setDialog] = useState(null); // 'activate' | 'end' | 'discard' | null
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (plan.data) document.title = `${planTitle(plan.data)} — Spotter`;
  }, [plan.data]);

  if (plan.isPending) return <div className={s.page}><Loading /></div>;
  if (plan.isError) return (
    <div className={s.page}>
      <div className={s.error} role="alert">
        <p>{plan.error?.code === 'PLAN_NOT_FOUND' ? 'This plan could not be found.' : "Couldn't load this plan. Please try again."}</p>
        <button type="button" className={`${s.button} ${s.secondary}`} onClick={() => plan.refetch()}>Try again</button>
      </div>
    </div>
  );

  const data = plan.data;
  const isDraft = data.status === 'DRAFT';
  const isActive = data.status === 'ACTIVE';
  const today = todayInPlanTimezone(timezone);
  const days = useMemo(() => sortPlanDays(data.days || []), [data.days]);

  // Auto-select today's day if within plan, else first day
  const todayDayIndex = useMemo(() => {
    const todayDate = new Date(`${today}T12:00:00`);
    // JS getDay: 0=Sun, convert to 0=Mon (our format)
    const jsDay = todayDate.getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, [today]);

  const activeDayIndex = selectedDay ?? (
    days.find((d) => dayIndex(d) === todayDayIndex) ? todayDayIndex : (days.length > 0 ? dayIndex(days[0]) : 0)
  );

  const activeDay = days.find((d) => dayIndex(d) === activeDayIndex) || days[0];
  const isDayToday = activeDayIndex === todayDayIndex && isActive;

  // Compute scheduledDate for the active day
  const scheduledDate = useMemo(() => {
    if (!isDayToday) return today;
    return today;
  }, [isDayToday, today]);

  return (
    <div className={s.page}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className={s.detailHeader}>
        <div>
          <p className={s.eyebrow}>
            {isDraft ? 'DRAFT PLAN' : isActive ? 'ACTIVE PLAN' : 'PLAN'}
          </p>
          <h1 className={s.detailTitle}>{planTitle(data)}</h1>
          <div className={s.detailMeta}>
            <PlanStatusBadge status={data.status} />
            <span>{formatPlanDateRange(data.startDate, data.endDate)}</span>
            {data.timezone && <span>{data.timezone}</span>}
          </div>
        </div>
        <div className={s.detailActions}>
          {isDraft && (
            <>
              <button type="button" className={`${s.button} ${s.primary}`} onClick={() => setDialog('activate')}>
                Activate
              </button>
              <button type="button" className={`${s.button} ${s.secondary}`} onClick={() => setDialog('discard')}>
                Discard
              </button>
            </>
          )}
          {isActive && (
            <button type="button" className={`${s.button} ${s.secondary}`} onClick={() => setDialog('end')}>
              End plan
            </button>
          )}
        </div>
      </div>

      {/* ── Draft banner ───────────────────────────────── */}
      {isDraft && (
        <div className={s.draftBanner}>
          <img src={pointingBit} alt="" className={s.bit} />
          <p>Here's your week. Review your training and nutrition, then activate when you're ready.</p>
        </div>
      )}

      {/* ── Day selector (Mon–Sun pills) ───────────────── */}
      {days.length > 0 && (
        <nav className={s.daySelector} aria-label="Days of the week">
          {days.map((day) => {
            const di = dayIndex(day);
            const isSelected = di === activeDayIndex;
            const isTodayPill = di === todayDayIndex;
            return (
              <button
                key={di}
                type="button"
                className={`${s.dayPill} ${isSelected ? s.dayPillActive : ''} ${isTodayPill && !isSelected ? s.dayPillToday : ''}`}
                onClick={() => setSelectedDay(di)}
                aria-current={isSelected ? 'true' : undefined}
              >
                <span>{weekDayShort(di)}</span>
                {weekDayLabel(di).slice(0, 3)}
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Day content ────────────────────────────────── */}
      <PlanDay
        day={activeDay}
        nutritionStyle={data.nutritionPlanStyle}
        isToday={isDayToday}
        isActive={isActive}
        scheduledDate={scheduledDate}
        onStartWorkout={(payload) => startFromPlan.mutate(payload)}
        startingWorkout={startFromPlan.isPending}
      />

      {/* ── Start-from-plan error ──────────────────────── */}
      {startFromPlan.isError && (
        <div className={s.error} role="alert">
          <p>{startErrorMessage(startFromPlan.error)}</p>
        </div>
      )}

      {/* ── Signature ──────────────────────────────────── */}
      <p className={s.signature}>YOUR PLAN. <span>YOUR PACE.</span> YOUR PROGRESS.</p>

      {/* ── Dialogs ────────────────────────────────────── */}
      {dialog === 'activate' && (
        <ActivationDialog
          plan={data}
          onClose={() => setDialog(null)}
          onSuccess={() => plan.refetch()}
        />
      )}
      {dialog === 'end' && (
        <EndPlanDialog
          plan={data}
          onClose={() => setDialog(null)}
          onSuccess={() => { plan.refetch(); navigate('/app/plans', { replace: true }); }}
        />
      )}
      {dialog === 'discard' && (
        <DiscardDialog
          plan={data}
          onClose={() => setDialog(null)}
          onSuccess={() => navigate('/app/plans', { replace: true })}
        />
      )}
    </div>
  );
}

function Loading() {
  return <div className={s.skeletons} role="status" aria-label="Loading plan"><div className={s.skeleton} style={{ height: 120 }} /><div className={s.skeleton} style={{ height: 60 }} /><div className={s.skeleton} /><div className={s.skeleton} /></div>;
}

function startErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  const messages = {
    ACTIVE_WORKOUT_EXISTS: 'You already have a workout in progress. Finish or cancel it first.',
    PLAN_OCCURRENCE_COMPLETED: 'This workout has already been completed today.',
    PLAN_NOT_ACTIVE: 'This plan is no longer active.',
    PLAN_NOT_FOUND: 'This plan could not be found.',
    PLAN_NOT_STARTED: "This plan hasn't started yet.",
    PLAN_EXPIRED: "This plan's coverage has ended.",
  };
  return messages[error.code] || "Couldn't start the workout. Please try again.";
}
