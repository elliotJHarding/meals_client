/** Monday-normalise a date to 00:00 of that week's Monday (matches apps/web). */
export const mondayOf = (date: Date): Date => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Whole weeks from `a` to `b`, rounded. Both are expected to be Monday-normalised
 * (see `mondayOf`); rounding absorbs any DST hour drift so the result stays an
 * exact integer count of weeks. Positive when `b` is later than `a`.
 */
export const weeksBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / (7 * 86_400_000));
