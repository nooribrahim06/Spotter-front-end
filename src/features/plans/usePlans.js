import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { invalidateActivityDays } from '../daily-summary/invalidation.js';
import { plansApi as api } from './plans.api.js';

/* ── Cache keys (user-scoped, clears on logout) ──────────── */

export function usePlanKeys() {
  const userId = useAuthStore((s) => s.user?.id);
  return {
    root:     ['plans', userId],
    context:  ['plans', userId, 'context'],
    active:   ['plans', userId, 'active'],
    list:     (filters) => ['plans', userId, 'list', filters],
    detail:   (id) => ['plans', userId, 'detail', id],
    schedule: (date) => ['plans', userId, 'schedule', date],
  };
}

const QUERY_OPTIONS = { retry: false, gcTime: 0, refetchOnWindowFocus: true };

/* ── Queries ─────────────────────────────────────────────── */

/** Readiness context for plan generation */
export function usePlanContext() {
  const keys = usePlanKeys();
  return useQuery({
    ...QUERY_OPTIONS,
    queryKey: keys.context,
    queryFn: ({ signal }) => api.context(signal),
  });
}

/** Current active plan summary (null when none) */
export function useActivePlan() {
  const keys = usePlanKeys();
  return useQuery({
    ...QUERY_OPTIONS,
    queryKey: keys.active,
    queryFn: ({ signal }) => api.active(signal),
  });
}

/** Paginated plan list */
export function usePlanList(filters = {}) {
  const keys = usePlanKeys();
  return useQuery({
    ...QUERY_OPTIONS,
    refetchOnWindowFocus: false,
    queryKey: keys.list(filters),
    queryFn: ({ signal }) => api.list(filters, signal),
    enabled: true,
  });
}

/** Full plan detail (with days) */
export function usePlanDetail(planId) {
  const keys = usePlanKeys();
  return useQuery({
    ...QUERY_OPTIONS,
    queryKey: keys.detail(planId),
    queryFn: ({ signal }) => api.plan(planId, signal),
    enabled: Boolean(planId),
  });
}

/** Schedule for a specific date (from active plan) */
export function usePlanSchedule(date) {
  const keys = usePlanKeys();
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    ...QUERY_OPTIONS,
    refetchOnWindowFocus: true,
    queryKey: keys.schedule(date),
    queryFn: ({ signal }) => api.schedule(date, signal),
    enabled: Boolean(date) && Boolean(userId),
  });
}

/* ── Mutations ───────────────────────────────────────────── */

/** Generate a new draft plan. Returns { status, data } — caller handles navigation. */
export function useGeneratePlan() {
  const client = useQueryClient();
  const keys = usePlanKeys();
  return useMutation({
    retry: false,
    mutationFn: ({ startDate, endDate }) => api.generate({ startDate, endDate }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.list({}) });
      // Invalidate broadly since generate response shape may vary
      client.invalidateQueries({ queryKey: keys.root });
    },
  });
}

/** Activate a draft plan. Handles expectedActivePlanId concurrency. */
export function useActivatePlan() {
  const client = useQueryClient();
  const keys = usePlanKeys();
  return useMutation({
    retry: false,
    mutationFn: ({ planId, expectedActivePlanId }) =>
      api.activate(planId, { expectedActivePlanId }),
    onSuccess: async (result, { planId }) => {
      if (useAuthStore.getState().user?.id !== keys.root[1]) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.active }),
        client.invalidateQueries({ queryKey: keys.detail(planId) }),
        client.invalidateQueries({ queryKey: keys.list({}) }),
        client.invalidateQueries({ queryKey: ['daily-summary'] }),
      ]);
    },
  });
}

/** End the active plan. */
export function useEndPlan() {
  const client = useQueryClient();
  const keys = usePlanKeys();
  return useMutation({
    retry: false,
    mutationFn: (planId) => api.end(planId),
    onSuccess: async (_result, planId) => {
      if (useAuthStore.getState().user?.id !== keys.root[1]) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.active }),
        client.invalidateQueries({ queryKey: keys.detail(planId) }),
        client.invalidateQueries({ queryKey: keys.list({}) }),
        client.invalidateQueries({ queryKey: ['daily-summary'] }),
      ]);
    },
  });
}

/** Discard a draft plan. */
export function useDiscardPlan() {
  const client = useQueryClient();
  const keys = usePlanKeys();
  return useMutation({
    retry: false,
    mutationFn: (planId) => api.discard(planId),
    onSuccess: async (_result, planId) => {
      if (useAuthStore.getState().user?.id !== keys.root[1]) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.detail(planId) }),
        client.invalidateQueries({ queryKey: keys.list({}) }),
      ]);
    },
  });
}

/**
 * Start an actual workout from a plan prescription.
 * Returns { status: 200|201, data: workout }
 * 200 = resume existing occurrence
 * 201 = new workout created
 */
export function useStartFromPlan() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    retry: false,
    mutationFn: ({ planWorkoutId, scheduledDate }) =>
      api.startFromPlan({ planWorkoutId, scheduledDate }),
    onSuccess: async ({ data: workout }) => {
      if (useAuthStore.getState().user?.id !== userId) return;
      // Invalidate training state so the workout session loads fresh
      await Promise.all([
        client.invalidateQueries({ queryKey: ['training', userId, 'active'] }),
        client.invalidateQueries({ queryKey: ['training', userId, 'history'] }),
        client.invalidateQueries({ queryKey: ['daily-summary'] }),
      ]);
      if (workout?.id) {
        navigate(`/app/training/workouts/${workout.id}`);
      }
    },
  });
}

/**
 * Log an actual meal from a plan meal option.
 * Invalidates daily summary so today's calorie count updates.
 */
export function useLogMealFromPlan() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (payload) => api.logMealFromPlan(payload),
    onSuccess: (data) => {
      invalidateActivityDays(client, data?.occurredAt);
      client.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}
