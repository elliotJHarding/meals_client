import { formatDate } from './api-client';

/**
 * Single source of truth for every TanStack Query cache key. Hooks and the
 * mutations that invalidate them both reference these so the keys can never
 * drift apart.
 *
 * The week key is `['plans','week', formatDate(weekStart)]` — one cache entry
 * per Monday-keyed week, reproducing the hand-written hook's
 * `weeks[formatDate(weekStart)]` map. Because each week is its own entry,
 * revisiting a week reads instantly from cache while TanStack runs a background
 * refetch (staleTime defaults to 0); switching weeks never blocks render.
 */
export const queryKeys = {
  plans: {
    week: (weekStart: Date) => ['plans', 'week', formatDate(weekStart)] as const,
  },
  meals: ['meals'] as const,
  receipts: ['receipts'] as const,
  familyGroup: ['familyGroup'] as const,
  calendar: {
    authorized: ['calendar', 'authorized'] as const,
    list: ['calendar', 'list'] as const,
  },
} as const;
