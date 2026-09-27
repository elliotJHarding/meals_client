import { useQuery } from '@tanstack/react-query';
import type { MealDto } from '@elliotJHarding/meals-api';
import { queryKeys } from './keys';
import { useMealsApi } from './provider';

/**
 * The meal library. The raw cache stays canonical (unsorted, as the server
 * returns it); the alphabetical sort lives in `select` so every consumer gets
 * sorted data without mutating the cache. The library is populated as a
 * side-effect of receipt ingestion, so `useIngestReceipt` invalidates this key.
 */
export function useMeals() {
  const { mealsApi } = useMealsApi();
  return useQuery({
    queryKey: queryKeys.meals,
    queryFn: async () => (await mealsApi.getAllMeals()).data,
    select: (meals: MealDto[]) => [...meals].sort((a, b) => a.name.localeCompare(b.name)),
  });
}
