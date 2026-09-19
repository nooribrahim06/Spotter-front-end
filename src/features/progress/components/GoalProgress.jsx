import { Link } from 'react-router-dom';
import { goalTypeMeta, formatGoalDate } from '../../goals/goals.domain.js';
import { displayNumber } from '../../daily-summary/daily-summary.domain.js';
import { useGoalProgress } from '../useProgress.js';
import { JourneyError, SectionLoading } from './JourneyUI.jsx';
import styles from '../Progress.module.css';
export default function GoalProgress({ onCheckIn }) {
  const query = useGoalProgress();
  if (query.isPending) return <SectionLoading label="Loading active goal" height="310px" />;
  if (query.isError) return <JourneyError error={query.error} onRetry={query.refetch} onCheckIn={onCheckIn} />;
  const { goal, starting, current, weightChangeKg, remainingKg, progressPercentage } = query.data;
  const change = weightChangeKg == null ? '—' : `${weightChangeKg > 0 ? '+' : ''}${displayNumber(weightChangeKg)} kg`;
  const toward = weightChangeKg != null && (goal.goalType === 'LOSE_WEIGHT' ? weightChangeKg < 0 : ['GAIN_WEIGHT', 'BUILD_MUSCLE'].includes(goal.goalType) && goal.targetWeightKg != null ? weightChangeKg > 0 : false);
  return <section className={styles.goal} aria-labelledby="active-goal-title">
    <div className={styles.sectionTop}><p className={styles.eyebrow}>Active goal</p><Link to="/app/goals">View goal ↗</Link></div>
    <div className={styles.goalBody}><div><h2 id="active-goal-title">{goalTypeMeta(goal.goalType).label}</h2><p>{goalTypeMeta(goal.goalType).description}</p><div className={styles.goalWeights}><div><span>Starting</span><strong>{displayNumber(starting.weightKg)} <small>kg</small></strong></div><div><span>Current</span><strong>{displayNumber(current.weightKg)} <small>kg</small></strong></div><div><span>Target</span><strong>{displayNumber(goal.targetWeightKg)}{goal.targetWeightKg != null && <small> kg</small>}</strong></div></div></div>
      <div className={styles.goalProgress}>{progressPercentage != null ? <><strong>{displayNumber(progressPercentage)}<small>%</small></strong><span>of the way to your target</span><progress max="100" value={progressPercentage} aria-label="Progress toward target weight" /></> : <><span className={styles.openGoal}>Your rhythm.<br /><em>Your pace.</em></span><span>This goal is bigger than a weight percentage.</span></>}</div>
    </div>
    <div className={styles.goalFooter}><span><strong>{change}</strong> {toward ? 'toward your weight target' : 'change since your starting point'}</span>{remainingKg != null && <span><strong>{displayNumber(remainingKg)} kg</strong> remaining</span>}{goal.targetDate && <span>Target date · {formatGoalDate(goal.targetDate, { short: true })}</span>}</div>
  </section>;
}
