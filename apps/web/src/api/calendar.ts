import { CalendarApi, Calendar } from '@elliotJHarding/meals-api';
import { axiosInstance, baseUrl, configuration } from './client';

const api = new CalendarApi(configuration, baseUrl, axiosInstance);

export async function getCalendars(): Promise<Calendar[]> {
  const response = await api.getAllCalendars();
  return response.data;
}

export async function isCalendarAuthorized(): Promise<boolean> {
  const response = await api.isCalendarAuthorized();
  return response.data;
}

export async function getCalendarAuthUrl(): Promise<string> {
  const response = await api.getCalendarAuthUrl();
  return response.data;
}

// Called from the OAuth callback route with the `code` query param.
export async function linkCalendar(code: string): Promise<void> {
  await api.linkCalendar(decodeURI(code));
}

// The v2 contract takes full Calendar objects (v1 passed bare ids against an
// older package); the server reads each calendar's `active` flag.
export async function updateActiveCalendars(calendars: Calendar[]): Promise<Calendar[]> {
  const response = await api.updateActiveCalendars(calendars);
  return response.data;
}
