import { useCallback, useEffect, useRef } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { PlanDto, PlanMealDto } from '@elliotJHarding/meals-api';
import { asApiDate, formatDate, type MealsApiBundle } from './api-client';
import { queryKeys } from './keys';
import { useMealsApi } from './provider';

export type SaveState = 'idle' | 'saving' | 'error';

// The generated PlanDto types `date` as Date, but the wire format is the
// LocalDate string YYYY-MM-DD; at runtime plan.date IS that string. All week/day
// matching is string comparison via this key — keep it or matching breaks.
const dateKeyOf = (plan: PlanDto): string => String(plan.date);

const planFromWeek = (plans: PlanDto[], date: Date): PlanDto | undefined =>
  plans.find((plan) => dateKeyOf(plan) === formatDate(date));

/**
 * Reads the seven plans for a Monday-keyed week.
 *
 * Cache key is per-week, so a revisited week renders instantly from cache while
 * a background refetch runs, and switching weeks never blocks render. Returns
 * the raw PlanDto[] plus a pure `planFor` selector — kept as a derived helper,
 * not a second query.
 */
export function useWeekPlansQuery(weekStart: Date) {
  const { plansApi } = useMealsApi();
  const weekKey = queryKeys.plans.week(weekStart);

  const query = useQuery({
    queryKey: weekKey,
    queryFn: async () => {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const response = await plansApi.getPlansInRange(asApiDate(weekStart), asApiDate(end));
      return response.data;
    },
  });

  const plans = query.data ?? [];
  const planFor = (date: Date): PlanDto | undefined => planFromWeek(plans, date);

  return { ...query, plans, planFor };
}

/**
 * The optimistic save mutation, reproducing the hand-written hook's two-phase
 * refetch loop:
 *
 *  - onMutate writes an optimistic PlanDto into the week cache (replacing the
 *    matching-date plan, or appending a new one), so the entry renders before
 *    the network resolves. Optimistic entries have no id, which the views' react
 *    keys (`planMeal.id ?? `${freeText}-${index}``) already tolerate.
 *  - onSuccess invalidates the week QUIETLY (background refetch) so the
 *    server-assigned ids land without a loading flash.
 *  - onError invalidates the week too, rolling the cache back to server truth.
 *
 * Mutation `status` is surfaced as the existing 'idle' | 'saving' | 'error'
 * save indicator by the composite hook below.
 */
export function useSavePlan(weekStart: Date) {
  const { plansApi } = useMealsApi();
  const queryClient = useQueryClient();
  const weekKey = queryKeys.plans.week(weekStart);

  return useMutation({
    mutationFn: async ({ date, planMeals }: { date: Date; planMeals: PlanMealDto[] }) => {
      const existing = planFromWeek(queryClient.getQueryData<PlanDto[]>(weekKey) ?? [], date);
      const plan = buildOptimisticPlan(existing, date, planMeals);
      if (existing?.id != null) {
        await plansApi.updatePlan(existing.id, plan);
      } else {
        await plansApi.createPlan(plan);
      }
    },
    onMutate: ({ date, planMeals }: { date: Date; planMeals: PlanMealDto[] }) => {
      const existing = planFromWeek(queryClient.getQueryData<PlanDto[]>(weekKey) ?? [], date);
      const optimistic = buildOptimisticPlan(existing, date, planMeals);
      queryClient.setQueryData<PlanDto[]>(weekKey, (current) => {
        const week = current ?? [];
        return existing
          ? week.map((plan) => (dateKeyOf(plan) === formatDate(date) ? optimistic : plan))
          : [...week, optimistic];
      });
    },
    onSuccess: () => {
      // Re-fetch quietly so local state picks up server-assigned ids.
      void queryClient.invalidateQueries({ queryKey: weekKey });
    },
    onError: (error) => {
      console.error('Failed to save plan', error);
      // Roll back to server truth by re-fetching the week.
      void queryClient.invalidateQueries({ queryKey: weekKey });
    },
  });
}

const buildOptimisticPlan = (
  existing: PlanDto | undefined,
  date: Date,
  planMeals: PlanMealDto[],
): PlanDto => ({
  ...(existing ?? {}),
  date: asApiDate(date),
  planMeals,
  shoppingListItems: existing?.shoppingListItems ?? [],
});

/**
 * Drop-in replacement for the original hand-written `useWeekPlans`, returning
 * the exact same contract — `{ plans, planFor, loading, saveState, addEntry,
 * removeEntry }` — so WeekView / DayBlock compile unchanged.
 *
 * `loading` reproduces the original one-shot boot flag: it is true only while
 * the very first week ever loaded is in flight. Once any week has resolved it
 * stays false, so switching weeks renders empty day blocks that fill in when
 * their data lands rather than flashing a full-page loader.
 *
 * `saveState` maps the mutation status: pending -> 'saving', error -> 'error'
 * (auto-cleared after 2500ms), otherwise 'idle'. addEntry / removeEntry are the
 * thin callers that compute the new planMeals array and return the mutation
 * promise.
 */
export function useWeekPlans(weekStart: Date) {
  const { plans, planFor, isLoading } = useWeekPlansQuery(weekStart);
  const save = useSavePlan(weekStart);

  const everLoaded = useRef(false);
  if (!isLoading) {
    everLoaded.current = true;
  }
  const loading = isLoading && !everLoaded.current;

  // Auto-clear the error indicator 2500ms after a failed save, matching the
  // original UI affordance. The error stays derived from mutation status;
  // `reset()` returns the mutation to idle, which flips `saveState` back.
  const reset = save.reset;
  useEffect(() => {
    if (!save.isError) return;
    const timer = setTimeout(reset, 2500);
    return () => clearTimeout(timer);
  }, [save.isError, reset]);

  const saveState: SaveState = save.isPending ? 'saving' : save.isError ? 'error' : 'idle';

  const savePlan = useCallback(
    (date: Date, planMeals: PlanMealDto[]) => save.mutateAsync({ date, planMeals }),
    [save],
  );

  const addEntry = useCallback(
    (date: Date, text: string) => {
      const entry: PlanMealDto = { freeText: text };
      return savePlan(date, [...(planFor(date)?.planMeals ?? []), entry]);
    },
    [planFor, savePlan],
  );

  const removeEntry = useCallback(
    (date: Date, index: number) => {
      const planMeals = (planFor(date)?.planMeals ?? []).filter((_, i) => i !== index);
      return savePlan(date, planMeals);
    },
    [planFor, savePlan],
  );

  return { plans, planFor, loading, saveState, addEntry, removeEntry };
}

/**
 * Imperative helper for callers that want to invalidate a specific week from
 * outside React (e.g. after an ingest that touched plans). Exposed for symmetry
 * with the other invalidation seams; not required by the views.
 */
export const invalidateWeek = (queryClient: QueryClient, weekStart: Date) =>
  queryClient.invalidateQueries({ queryKey: queryKeys.plans.week(weekStart) });

export type { MealsApiBundle };
