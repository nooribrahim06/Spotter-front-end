import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';
import { progressError } from '../progress.domain.js';
import styles from '../Progress.module.css';
export function SectionLoading({ label, height = '220px' }) { return <div role="status" aria-label={label}><Skeleton height={height} borderRadius="24px" /></div>; }
export function JourneyError({ error, onRetry, onCheckIn }) {
  const { code, status, details } = progressError(error);
  const field = Array.isArray(details) ? details[0]?.field : details?.field;
  let title = 'Your data needs another moment.', copy = 'We couldn’t load this part of your journey. Your saved entries are safe.', to, action;
  if (code === 'ACTIVE_GOAL_REQUIRED') { title = 'Give your journey a direction.'; copy = 'Choose what you’re working toward. Spotter will connect your check-ins to your goal.'; to = '/app/goals'; action = 'Set a goal'; }
  else if (code === 'PROFILE_INCOMPLETE') {
    const weight = ['currentWeightKg', 'startingWeightKg', 'weightKg'].includes(field);
    title = weight ? 'One more number to get started.' : 'Let’s fill in the missing piece.';
    copy = field === 'startingWeightKg' ? 'A starting weight isn’t available for this goal. Add a check-in and review your goal’s starting point.' : weight ? 'Add your current weight so Spotter can put your goal in context.' : 'Complete your body basics to give Spotter the context it needs.';
    to = weight && onCheckIn ? null : '/app/profile'; action = weight && onCheckIn ? 'Check In' : 'Complete profile';
  }
  else if (['DAILY_SUMMARY_TIMEZONE_REQUIRED', 'PROGRESS_TIMEZONE_REQUIRED'].includes(code)) { title = 'Put your day in the right timezone.'; copy = 'Set your timezone in Profile → Region & language so your meals, workouts, and check-ins land on the right day.'; to = '/app/profile'; action = 'Set timezone'; }
  else if (code === 'BODY_PROFILE_NOT_FOUND') { title = 'Start with your body basics.'; copy = 'Complete your fitness profile, then come back for your first check-in.'; to = '/app/profile'; action = 'Complete profile'; }
  else if (code === 'PROGRESS_ENTRY_NOT_FOUND') { title = 'This check-in isn’t available.'; copy = 'Return to your history to choose another entry.'; }
  else if (status === 401) { title = 'Let’s get you signed back in.'; copy = 'Your session has ended. Sign in to see your journey.'; to = '/login'; action = 'Sign in'; }
  else if (status === 429) { title = 'A quick breather.'; copy = 'There have been a few too many requests. Give it a moment, then try again.'; }
  return <section className={styles.notice} role="status"><h3>{title}</h3><p>{copy}</p>{to ? <Link className={styles.textLink} to={to}>{action} →</Link> : action ? <Button onClick={onCheckIn}>{action}</Button> : onRetry && code !== 'PROGRESS_ENTRY_NOT_FOUND' ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}</section>;
}
