import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { invalidateActivityDays, cachedActivityTime } from '../daily-summary/invalidation.js';
import { trainingApi as api } from './training.api.js';

// User-scoped, memory-only queries. No workout data survives the authenticated view.
export function useTrainingKeys() {
  const userId = useAuthStore(s => s.user?.id);
  return { root: ['training', userId], active: ['training', userId, 'active'], detail: id => ['training', userId, 'workout', id], history: ['training', userId, 'history'], catalog: ['training', userId, 'exercises'] };
}
const options = { retry: false, gcTime: 0, refetchOnWindowFocus: true };
export function useActiveWorkout() {
  const keys = useTrainingKeys();
  return useQuery({ ...options, queryKey: keys.active, queryFn: ({ signal }) => api.active(signal) });
}
export function useWorkout(id) {
  const keys = useTrainingKeys();
  return useQuery({ ...options, queryKey: keys.detail(id), queryFn: ({ signal }) => api.workout(id, signal), enabled: !!id });
}
export function useTrainingHistory(filters = {}, enabled = true) {
  const keys = useTrainingKeys();
  return useQuery({
    ...options,
    queryKey: [...keys.history, filters],
    queryFn: async ({ signal }) => {
      let page = 1;
      let allItems = [];
      let totalPages = 1;

      do {
        const response = await api.history({ ...filters, page, limit: 50 }, signal);
        allItems = allItems.concat(response.items);
        totalPages = response.meta?.totalPages || 1;
        page++;
      } while (page <= totalPages);

      return { items: allItems };
    },
    enabled
  });
}
export function useExerciseConfig() {
  const keys = useTrainingKeys();
  return useQuery({ ...options, staleTime: 300000, queryKey: [...keys.catalog, 'config'], queryFn: ({ signal }) => api.config(signal) });
}
export function useExercises(filters) {
  const keys = useTrainingKeys();
  return useQuery({ ...options, queryKey: [...keys.catalog, filters], queryFn: ({ signal }) => api.exercises(filters, signal) });
}
export function useExercise(id) {
  const keys = useTrainingKeys();
  return useQuery({ ...options, queryKey: [...keys.catalog, 'detail', id], queryFn: ({ signal }) => api.exercise(id, signal), enabled: !!id });
}
export function useTrainingAction() {
  const client = useQueryClient(), keys = useTrainingKeys(), navigate = useNavigate();
  const publish = workout => {
    client.setQueryData(keys.detail(workout.id), workout);
    client.setQueryData(keys.active, workout.status === 'IN_PROGRESS' ? workout : null);
  };
  return useMutation({
    retry: false,
    mutationFn: ({ type, id, rowId, data }) => api[type](...(type === 'start' ? [data] : ['update', 'remove'].includes(type) ? [id, rowId, data] : [id, data])),
    onMutate: ({ id }) => ({ oldTime: id ? cachedActivityTime(client, 'training', id, 'startedAt') : null }),
    onSuccess: async (result, variables, context) => {
      // A mutation from a previous login must never refill the new user's cache.
      if (useAuthStore.getState().user?.id !== keys.root[1]) return;
      await client.cancelQueries({ queryKey: keys.root });
      const { type, id } = variables;
      if (['start', 'edit', 'complete', 'cancel'].includes(type)) publish(result);
      else if (result) {
        const update = workout => workout ? { ...workout, exercises: (type === 'add' ? [...workout.exercises.filter(row => row.id !== result.id), result] : workout.exercises.map(row => row.id === result.id ? result : row)).sort((a, b) => a.exerciseOrder - b.exerciseOrder) } : workout;
        client.setQueryData(keys.detail(id), update);
        client.setQueryData(keys.active, update);
      }
      await Promise.all([
        invalidateActivityDays(client, ...(type === 'start' ? [result?.startedAt] : [context?.oldTime, result?.startedAt || context?.oldTime])),
        client.invalidateQueries({ queryKey: keys.active }),
        ...(id ? [client.invalidateQueries({ queryKey: keys.detail(id) })] : []),
        ...(['start', 'complete', 'cancel'].includes(type) ? [client.invalidateQueries({ queryKey: keys.history })] : []),
      ]);
    },
    onError: async (error, { id }) => {
      if (useAuthStore.getState().user?.id !== keys.root[1]) return;
      if (error.code === 'ACTIVE_WORKOUT_EXISTS') {
        try {
          const active = await client.fetchQuery({ queryKey: keys.active, queryFn: ({ signal }) => api.active(signal), retry: false });
          if (active) { publish(active); navigate(`/app/training/workouts/${active.id}`); }
        } catch { /* The start form retains input and its retry action. */ }
      }
      if (['WORKOUT_NOT_FOUND', 'WORKOUT_EXERCISE_NOT_FOUND', 'INVALID_WORKOUT_STATE', 'DUPLICATE_WORKOUT_EXERCISE', 'WORKOUT_EXERCISE_LIMIT_REACHED'].includes(error.code)) {
        if (error.code === 'WORKOUT_NOT_FOUND') navigate('/app/training', { replace: true });
        await Promise.all([client.invalidateQueries({ queryKey: keys.active }), client.invalidateQueries({ queryKey: keys.history }), ...(id ? [client.invalidateQueries({ queryKey: keys.detail(id) })] : [])]);
      }
      if (error.code === 'EXERCISE_NOT_FOUND') await client.invalidateQueries({ queryKey: keys.catalog });
    },
  });
}
