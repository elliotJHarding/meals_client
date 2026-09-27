import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Calendar, CalendarEventDto } from '@elliotJHarding/meals-api';
import { asApiDate } from './api-client';
import { queryKeys } from './keys';
import { useMealsApi } from './provider';

/**
 * Whether the caller has authorised calendar access. Drives whether the
 * calendars query runs. Any error maps to `false` (treated as not authorised),
 * matching the web view.
 */
export function useCalendarAuthorized() {
  const { calendarApi } = useMealsApi();
  return useQuery<boolean>({
    queryKey: queryKeys.calendar.authorized,
    queryFn: async () => {
      try {
        return (await calendarApi.isCalendarAuthorized()).data;
      } catch {
        return false;
      }
    },
  });
}

/**
 * The caller's calendars. Runs only once calendar access is authorised — the
 * web view nests this fetch inside the authorised branch, reproduced here with
 * `enabled: authorized === true`. Any error maps to an empty list.
 */
export function useCalendars(authorized: boolean) {
  const { calendarApi } = useMealsApi();
  return useQuery<Calendar[]>({
    queryKey: queryKeys.calendar.list,
    enabled: authorized === true,
    queryFn: async () => {
      try {
        return (await calendarApi.getAllCalendars()).data;
      } catch {
        return [];
      }
    },
  });
}

/**
 * Orders a day's events for display: all-day events first, then timed events
 * ascending by start time. Lifted from the v1 web client's CalendarEvents sort
 * so both clients order events identically. `time` arrives as a string despite
 * the `Date` type, so it is wrapped before comparison.
 */
export function sortCalendarEvents(a: CalendarEventDto, b: CalendarEventDto): number {
  if (a.allDay && b.allDay) return 0;
  if (a.allDay) return -1;
  if (b.allDay) return 1;
  if (a.time == null || b.time == null) return 0;
  return new Date(a.time).getTime() - new Date(b.time).getTime();
}

/**
 * The events falling on a given day, ready to render: filtered by local-day
 * match and sorted via {@link sortCalendarEvents}. Matching uses `toDateString`
 * equality (the v1 approach) and tolerates `time` being a wire string.
 */
export function eventsForDay(events: CalendarEventDto[], day: Date): CalendarEventDto[] {
  return events
    .filter((event) => event.time != null && new Date(event.time).toDateString() === day.toDateString())
    .sort(sortCalendarEvents);
}

/**
 * Reads the calendar events for a Monday-keyed week, mirroring
 * {@link useWeekPlansQuery}: one cache entry per week (instant on revisit,
 * background refetch), the same six-day span, and `asApiDate` so the formatted
 * day string satisfies the SDK's `Date` params.
 *
 * Only fetches once calendar access is authorised (`enabled: authorized ===
 * true`), reusing {@link useCalendarAuthorized}. Any error maps to an empty
 * list, matching {@link useCalendars}. Surfaces `authorized` so views have a
 * single tri-state source, and an `eventsFor(day)` selector that groups + sorts
 * a day's events (the analogue of `planFor`).
 */
export function useCalendarEvents(weekStart: Date) {
  const { calendarApi } = useMealsApi();
  const { data: authorized } = useCalendarAuthorized();

  const query = useQuery<CalendarEventDto[]>({
    queryKey: queryKeys.calendar.events(weekStart),
    enabled: authorized === true,
    queryFn: async () => {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      try {
        return (await calendarApi.getCalendarEvents(asApiDate(weekStart), asApiDate(end))).data;
      } catch {
        return [];
      }
    },
  });

  const events = query.data ?? [];
  const eventsFor = (day: Date): CalendarEventDto[] => eventsForDay(events, day);

  return { ...query, authorized, events, eventsFor };
}

/**
 * Updates the active calendars. The web view flips the toggled calendar's
 * `active` flag in local state immediately and reverts on failure — reproduced
 * here as an optimistic write to `['calendar','list']` in onMutate, snapshotting
 * the previous list, with onError restoring the snapshot. The server reads each
 * calendar's `active` flag; the v2 contract takes full Calendar objects.
 *
 * The caller passes the full intended Calendar[] (toggle already applied), which
 * both becomes the optimistic cache value and the request body, so the view no
 * longer needs to hold its own toggle state.
 */
export function useUpdateActiveCalendars() {
  const { calendarApi } = useMealsApi();
  const queryClient = useQueryClient();

  return useMutation<Calendar[], unknown, Calendar[], { previous: Calendar[] | undefined }>({
    mutationFn: async (calendars) => (await calendarApi.updateActiveCalendars(calendars)).data,
    onMutate: (calendars) => {
      const previous = queryClient.getQueryData<Calendar[]>(queryKeys.calendar.list);
      queryClient.setQueryData<Calendar[]>(queryKeys.calendar.list, calendars);
      return { previous };
    },
    onError: (_error, _calendars, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.calendar.list, context.previous);
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Calendar[]>(queryKeys.calendar.list, updated);
    },
  });
}

/**
 * Exchanges the OAuth `code` returned to the calendar-link callback for a
 * linked calendar. Modelled as a mutation; on success it invalidates both
 * calendar queries so authorisation and the calendar list refresh.
 *
 * The api wrapper decodes the code (`decodeURI`) before the SDK call — preserved
 * here. The open-external-consent + receive-the-code dance and the post-link
 * navigation are platform seams that stay in the view.
 */
export function useLinkCalendar() {
  const { calendarApi } = useMealsApi();
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (code) => {
      await calendarApi.linkCalendar(decodeURI(code));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.authorized });
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.list });
    },
  });
}

/**
 * Fetches the calendar OAuth consent URL. Kept as an imperative data op rather
 * than a query because it has no cacheable lifetime and is followed by a
 * one-shot redirect. The redirect itself (web: `window.location.href`; native:
 * an in-app browser / AuthSession) is the ExternalRedirectAdapter seam and lives
 * in the platform view — core only produces the URL.
 */
export function useCalendarAuthUrl() {
  const { calendarApi } = useMealsApi();
  return useMutation<string, unknown, void>({
    mutationFn: async () => (await calendarApi.getCalendarAuthUrl()).data,
  });
}
