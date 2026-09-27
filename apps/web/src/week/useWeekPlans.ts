import { useCallback, useEffect, useState } from 'react';
import { PlanDto, PlanMealDto } from '@elliotJHarding/meals-api';
import { asApiDate, formatDate } from '../api/client';
import * as plansApi from '../api/plans';

export type SaveState = 'idle' | 'saving' | 'error';

// The generated PlanDto types date as Date, but the wire format is the
// LocalDate string YYYY-MM-DD; at runtime plan.date is that string.
const dateKeyOf = (plan: PlanDto): string => String(plan.date);

export function useWeekPlans(weekStart: Date) {
  // Plans cached per week (keyed by week start) so revisited weeks render
  // instantly; every visit still re-fetches in the background. Only the very
  // first fetch sets `loading` — week changes keep rendering so the week
  // transition can animate, with days filling in when their data lands.
  const [weeks, setWeeks] = useState<Record<string, PlanDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const weekKey = formatDate(weekStart);
  const plans = weeks[weekKey] ?? [];

  const fetchWeek = useCallback(async () => {
    try {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const fetched = await plansApi.getPlansInRange(weekStart, end);
      setWeeks((current) => ({ ...current, [weekKey]: fetched }));
    } finally {
      setLoading(false);
    }
    // weekStart is a value; re-fetch when the formatted day changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  const planFor = (date: Date): PlanDto | undefined =>
    plans.find((plan) => dateKeyOf(plan) === formatDate(date));

  const savePlan = async (date: Date, planMeals: PlanMealDto[]) => {
    const existing = planFor(date);
    const optimistic: PlanDto = {
      ...(existing ?? {}),
      date: asApiDate(date),
      planMeals,
      shoppingListItems: existing?.shoppingListItems ?? [],
    };

    setWeeks((current) => {
      const week = current[weekKey] ?? [];
      const updated = existing
        ? week.map((plan) => (dateKeyOf(plan) === formatDate(date) ? optimistic : plan))
        : [...week, optimistic];
      return { ...current, [weekKey]: updated };
    });

    setSaveState('saving');
    try {
      if (existing?.id != null) {
        await plansApi.updatePlan(existing.id, optimistic);
      } else {
        await plansApi.createPlan(optimistic);
      }
      // Re-fetch quietly so local state picks up server-assigned ids
      await fetchWeek();
      setSaveState('idle');
    } catch (error) {
      console.error('Failed to save plan', error);
      setSaveState('error');
      await fetchWeek();
      setTimeout(() => setSaveState('idle'), 2500);
    }
  };

  const addEntry = (date: Date, text: string) => {
    const existing = planFor(date);
    const entry: PlanMealDto = { freeText: text };
    return savePlan(date, [...(existing?.planMeals ?? []), entry]);
  };

  const removeEntry = (date: Date, index: number) => {
    const existing = planFor(date);
    const planMeals = (existing?.planMeals ?? []).filter((_, i) => i !== index);
    return savePlan(date, planMeals);
  };

  return { plans, planFor, loading, saveState, addEntry, removeEntry };
}
