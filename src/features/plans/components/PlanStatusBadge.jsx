import s from '../Plans.module.css';
import { planStatusLabel, planStatusVariant } from '../plans.domain.js';

/**
 * PlanStatusBadge — Inline badge showing plan status.
 *
 * Variants: active, draft, replaced, ended, discarded, default.
 * Follows the same badge pattern as Training badges.
 */
export default function PlanStatusBadge({ status }) {
  const variant = planStatusVariant(status);
  const variantClass = {
    active: s.badgeActive,
    draft: s.badgeDraft,
    replaced: s.badgeReplaced,
    ended: s.badgeEnded,
    discarded: s.badgeDiscarded,
  }[variant] || '';

  return (
    <span className={`${s.badge} ${variantClass}`}>
      {planStatusLabel(status)}
    </span>
  );
}
