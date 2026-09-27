// The week-plans hook now lives in @meals_client/core, backed by TanStack Query
// (per-week cache key, optimistic save, background refetch). It returns the
// exact same contract this hook always did — { plans, planFor, loading,
// saveState, addEntry, removeEntry } — so WeekView / DayBlock are unchanged.
export { useWeekPlans, type SaveState } from '@meals_client/core';
