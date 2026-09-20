import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import s from '../Plans.module.css';
import { useActivePlan, usePlanList } from '../usePlans.js';
import {
  planTitle,
  planStatusLabel,
  formatPlanDateRange,
  todayInPlanTimezone,
  isTerminalStatus,
  formatInstant,
} from '../plans.domain.js';
import { useAuthStore } from '../../../stores/authStore.js';
import { BitCharacter } from '../../../components/landing/BitCharacter.jsx';
import PlanStatusBadge from './PlanStatusBadge.jsx';
import aiCoachBit from '../../../assets/identity/05_ai_coach/WEBP/05_ai_coach_768x1024.webp';

/**
 * PlansHome — Plans landing page.
 *
 * Active plan: hero card with CTAs.
 * No plan: Bit (thinking) + "Get started".
 * Below: draft cards, past plans, and Goals entry card.
 */
export default function PlansHome() {
  const activePlan = useActivePlan();
  const planList = usePlanList();
  const timezone = useAuthStore((st) => st.user?.timezone);
  const today = todayInPlanTimezone(timezone);

  useEffect(() => { document.title = 'Plans — Spotter'; }, []);

  // Separate drafts and past plans from the list
  const allPlans = planList.data?.items || planList.data || [];
  const drafts = allPlans.filter((p) => p.status === 'DRAFT' && p.id !== activePlan.data?.id);
  const pastPlans = allPlans.filter((p) => isTerminalStatus(p.status));

  return (
    <div className={s.page}>
      <header className={s.pageHeader}>
        <div>
          <p className={s.eyebrow}>YOUR JOURNEY</p>
          <h1>Plans<span>.</span></h1>
        </div>
        <Link to="/app/plans/new" className={s.textLink}>
          New plan <ArrowIcon />
        </Link>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      {activePlan.isPending ? (
        <Loading />
      ) : activePlan.isError ? (
        <div className={s.error} role="alert">
          <p>Couldn't load your active plan.</p>
          <button type="button" className={`${s.button} ${s.secondary}`} onClick={() => activePlan.refetch()}>Try again</button>
        </div>
      ) : activePlan.data ? (
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <p className={s.heroEyebrow}>
              <span className={s.liveDot} /> ACTIVE PLAN
            </p>
            <h2>{planTitle(activePlan.data).split(' ').slice(0, 3).join(' ')}<br /><span>in motion.</span></h2>
            <p>{formatPlanDateRange(activePlan.data.startDate, activePlan.data.endDate)}</p>
            <div className={s.heroCtas}>
              <Link className={`${s.button} ${s.coral}`} to={`/app/plans/${activePlan.data.id}`}>
                View full plan <ArrowIcon />
              </Link>
            </div>
          </div>
          <div className={s.heroArt}>
            <div className={s.orbit} />
            <span className={s.artLabel}>YOUR WEEK.</span>
            <img src={aiCoachBit} alt="" className={s.bit} />
            <span className={s.artFootnote}>PLANNED. PERSONAL. PURPOSEFUL.</span>
          </div>
          <div className={s.heroFooter}>
            <span>01 / PLAN</span>
            <span>02 / TRAIN</span>
            <span>03 / NOURISH</span>
          </div>
        </section>
      ) : (
        /* No active plan */
        <section className={s.empty}>
          <BitCharacter state="thinking" decorative />
          <h2>Turn your goals into a week you can actually follow.</h2>
          <p>Spotter builds your training and nutrition schedule around your profile, goals, and preferences.</p>
          <Link className={`${s.button} ${s.coral}`} to="/app/plans/new">
            Get started <ArrowIcon />
          </Link>
        </section>
      )}

      {/* ── Drafts ───────────────────────────────────────── */}
      {drafts.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <div>
              <p className={s.eyebrow}>READY TO REVIEW</p>
              <h2>Drafts</h2>
            </div>
          </div>
          <div className={s.cardList}>
            {drafts.map((plan) => (
              <Link key={plan.id} to={`/app/plans/${plan.id}`} className={s.planCard}>
                <div className={s.planCardInfo}>
                  <h3>{planTitle(plan)}</h3>
                  <p>{formatPlanDateRange(plan.startDate, plan.endDate)}</p>
                </div>
                <PlanStatusBadge status={plan.status} />
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Past plans ───────────────────────────────────── */}
      {pastPlans.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <div>
              <p className={s.eyebrow}>HISTORY</p>
              <h2>Past plans</h2>
            </div>
          </div>
          <div className={s.cardList}>
            {pastPlans.map((plan) => (
              <Link key={plan.id} to={`/app/plans/${plan.id}`} className={s.planCard}>
                <div className={s.planCardInfo}>
                  <h3>{planTitle(plan)}</h3>
                  <p>
                    {formatPlanDateRange(plan.startDate, plan.endDate)}
                    {plan.endedAt && ` · ${planStatusLabel(plan.status)} ${formatInstant(plan.endedAt)}`}
                  </p>
                </div>
                <PlanStatusBadge status={plan.status} />
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Goals entry card ─────────────────────────────── */}
      <Link to="/app/goals" className={s.goalsCard}>
        <div className={s.goalsCardIcon}>
          <GoalsIcon />
        </div>
        <div className={s.goalsCardContent}>
          <h3>Your Goals</h3>
          <p>Review and manage what you're working toward.</p>
        </div>
        <ArrowIcon />
      </Link>

      <p className={s.signature}>YOUR PLAN. <span>YOUR PACE.</span> YOUR PROGRESS.</p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function Loading() {
  return <div className={s.skeletons} role="status" aria-label="Loading plans"><div className={s.skeleton} style={{ height: 260 }} /><div className={s.skeleton} /><div className={s.skeleton} /></div>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

function GoalsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><path d="m15.5 8.5 4-4m-1 0h1v1" /></svg>;
}
