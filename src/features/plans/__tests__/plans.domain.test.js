import { describe, expect, it } from 'vitest';
import {
  planStatusLabel,
  planStatusVariant,
  isTerminalStatus,
  isActivatable,
  isPastCoverage,
  formatPlanDateRange,
  sortPlanDays,
  dayIndex,
  slotLabel,
  prescriptionSummary,
  nutritionPlanStyleLabel,
  styleHasMealOptions,
  formatNutrient,
  formatCalories,
  isReadinessBlocked,
  isReadinessReady,
  readinessMissingRequired,
  readinessCodeInfo,
  readinessEditorType,
  planTitle,
} from '../plans.domain.js';

describe('plans domain logic', () => {
  describe('status helpers', () => {
    it('maps status correctly to user-facing labels', () => {
      expect(planStatusLabel('DRAFT')).toBe('Draft');
      expect(planStatusLabel('ACTIVE')).toBe('Active');
      expect(planStatusLabel('SUPERSEDED')).toBe('Replaced');
      expect(planStatusLabel('ENDED')).toBe('Ended');
      expect(planStatusLabel('DISCARDED')).toBe('Discarded');
      expect(planStatusLabel('UNKNOWN')).toBe('UNKNOWN');
    });

    it('maps status correctly to css variants', () => {
      expect(planStatusVariant('ACTIVE')).toBe('active');
      expect(planStatusVariant('SUPERSEDED')).toBe('replaced');
      expect(planStatusVariant('UNKNOWN')).toBe('default');
    });

    it('identifies terminal statuses', () => {
      expect(isTerminalStatus('SUPERSEDED')).toBe(true);
      expect(isTerminalStatus('ENDED')).toBe(true);
      expect(isTerminalStatus('DISCARDED')).toBe(true);
      expect(isTerminalStatus('DRAFT')).toBe(false);
      expect(isTerminalStatus('ACTIVE')).toBe(false);
    });
  });

  describe('dates and coverage', () => {
    it('determines if plan is activatable on today', () => {
      const plan = { startDate: '2026-09-15', endDate: '2026-09-30' };
      expect(isActivatable(plan, '2026-09-20')).toBe(true);
      expect(isActivatable(plan, '2026-09-15')).toBe(true);
      expect(isActivatable(plan, '2026-09-30')).toBe(true);
      expect(isActivatable(plan, '2026-09-14')).toBe(false);
      expect(isActivatable(plan, '2026-10-01')).toBe(false);
      expect(isActivatable(null, '2026-09-20')).toBe(false);
    });

    it('detects if plan coverage is in the past', () => {
      const plan = { startDate: '2026-09-01', endDate: '2026-09-15' };
      expect(isPastCoverage(plan, '2026-09-20')).toBe(true);
      expect(isPastCoverage(plan, '2026-09-15')).toBe(false);
      expect(isPastCoverage(plan, '2026-09-10')).toBe(false);
    });

    it('formats plan date ranges', () => {
      expect(formatPlanDateRange('2026-09-15', '2026-09-30')).toContain('Sep 15');
      expect(formatPlanDateRange('2026-09-15', '2026-09-30')).toContain('Sep 30');
      expect(formatPlanDateRange(null, null)).toBe('');
    });
  });

  describe('days and sorting', () => {
    it('sorts days Monday through Sunday', () => {
      const days = [
        { id: 'wed', dayOfWeek: 3 },
        { id: 'mon', dayOfWeek: 1 },
        { id: 'sun', dayOfWeek: 7 },
      ];
      const sorted = sortPlanDays(days);
      expect(sorted.map(d => d.id)).toEqual(['mon', 'wed', 'sun']);
    });

    it('normalizes dayIndex for 1-based dayOfWeek (1=Mon..7=Sun)', () => {
      expect(dayIndex({ dayOfWeek: 1 })).toBe(0); // Monday
      expect(dayIndex({ dayOfWeek: 7 })).toBe(6); // Sunday
    });
  });

  describe('prescriptions and nutrition', () => {
    it('maps slots to user-facing labels', () => {
      expect(slotLabel('MORNING')).toBe('Morning');
      expect(slotLabel('AFTERNOON')).toBe('Afternoon');
      expect(slotLabel('EVENING')).toBe('Evening');
      expect(slotLabel('ANYTIME')).toBe('Flexible');
      expect(slotLabel('OTHER')).toBe('Any time');
    });

    it('builds concise prescription summary without empty metrics', () => {
      const summary = prescriptionSummary({
        setsCount: 3,
        repMin: 8,
        repMax: 12,
        weightKg: 20,
        restSeconds: 60,
      });
      expect(summary).toBe('3 × 8–12 reps · 20 kg · 60s rest');
    });

    it('formats duration and distance accurately', () => {
      const summary = prescriptionSummary({
        durationSeconds: 150,
        distanceMeters: 5000,
      });
      expect(summary).toBe('2 min 30 sec · 5 km');
    });

    it('identifies plan nutrition styles', () => {
      expect(styleHasMealOptions('EXACT_MEALS')).toBe(true);
      expect(styleHasMealOptions('FLEXIBLE_MEALS')).toBe(true);
      expect(styleHasMealOptions('MACRO_BASED')).toBe(false);
      expect(styleHasMealOptions('SIMPLE_GUIDANCE')).toBe(false);
    });

    it('formats nutrients and calories gracefully', () => {
      expect(formatCalories(2150.4)).toBe('2,150');
      expect(formatCalories(null)).toBe('—');
      expect(formatNutrient(145.67)).toBe('145.7g');
      expect(formatNutrient(null)).toBe('—');
    });
  });

  describe('readiness helpers', () => {
    it('detects blocked readiness context', () => {
      expect(isReadinessBlocked({ isReady: false, blockReason: 'PROFESSIONAL_CLEARANCE_REQUIRED' })).toBe(true);
      expect(isReadinessBlocked({ isReady: false })).toBe(false);
      expect(isReadinessBlocked({ isReady: true })).toBe(false);
    });

    it('detects fully ready context', () => {
      expect(isReadinessReady({ ready: true, missingRequired: [], issues: [] })).toBe(true);
      expect(isReadinessReady({ missingRequired: [] })).toBe(true);
      expect(isReadinessReady({ missingRequired: ['TIMEZONE'] })).toBe(false);
      expect(isReadinessReady({ missingRequired: [], issues: ['TRAINING_DAYS_EXCEED_AVAILABILITY'] })).toBe(false);
      expect(isReadinessReady({ ready: false, missingRequired: [] })).toBe(false);
      expect(isReadinessReady({ blockReason: 'PROFESSIONAL_CLEARANCE_REQUIRED', missingRequired: [] })).toBe(false);
      expect(isReadinessReady(null)).toBe(false);
    });

    it('combines missingRequired and issues into required items', () => {
      expect(readinessMissingRequired({ missingRequired: ['TIMEZONE'], issues: ['TRAINING_DAYS_EXCEED_AVAILABILITY'] }))
        .toEqual(['TIMEZONE', 'TRAINING_DAYS_EXCEED_AVAILABILITY']);
    });

    it('maps readiness codes with readinessCodeInfo', () => {
      expect(readinessCodeInfo('ACTIVE_GOAL').route).toBe('/app/plans');
      expect(readinessCodeInfo('CURRENT_WEIGHT').route).toBe('/app/progress?checkIn=1');
      expect(readinessCodeInfo('TIMEZONE').route).toBe('/app/profile');
      expect(readinessCodeInfo('UNKNOWN_CODE').route).toBe('/app/profile');
      expect(readinessCodeInfo('TIMEZONE').label).toBe('Set your timezone');
    });

    it('maps readiness codes to inline editor types with readinessEditorType', () => {
      expect(readinessEditorType('HEALTH_PROFILE')).toBe('health');
      expect(readinessEditorType('TRAINING_PROFILE')).toBe('training');
      expect(readinessEditorType('NUTRITION_PROFILE')).toBe('nutrition');
      expect(readinessEditorType('BODY_PROFILE')).toBe('body');
      expect(readinessEditorType('TIMEZONE')).toBe('account');
      expect(readinessEditorType('CURRENT_WEIGHT')).toBe('checkIn');
      expect(readinessEditorType('ACTIVE_GOAL')).toBe('goal');
      expect(readinessEditorType('UNKNOWN')).toBe(null);
    });
  });

  describe('plan titles', () => {
    it('formats title from title or fallback', () => {
      expect(planTitle({ title: 'Marathon prep' })).toBe('Marathon prep');
      expect(planTitle({})).toBe('Your Plan');
      expect(planTitle(null)).toBe('Your Plan');
    });
  });
});
