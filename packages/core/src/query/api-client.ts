import {
  AuthenticationApi,
  CalendarApi,
  Configuration,
  FamilyGroupApi,
  MealsApi,
  PlansApi,
  ReceiptsApi,
} from '@elliotJHarding/meals-api';
import type { AxiosInstance } from 'axios';

/**
 * The api-client platform seam.
 *
 * Core's hooks never build their own axios instance — the construction of
 * axios + Configuration is the only web-specific part of the data layer, so it
 * is injected here. Web supplies a cookie client
 * (`axios.create({ baseURL, withCredentials: true })` +
 * `new Configuration({ basePath })`); native supplies a bearer client
 * (`axios.create({ baseURL })` + `new Configuration({ basePath, accessToken,
 * baseOptions: { headers: { Authorization } } })`). The generated SDK's
 * `Configuration.accessToken` (fn) and `Configuration.baseOptions` are the
 * built-in hooks for the native path — no SDK change is needed.
 */
export interface ApiClientConfig {
  baseUrl: string;
  configuration: Configuration;
  axiosInstance: AxiosInstance;
}

/**
 * The bundle of generated SDK classes the hooks call. Built once per
 * ApiClientConfig and handed to the hooks through MealsApiProvider, mirroring
 * the way the web `api/*.ts` modules instantiate each SDK class at module
 * scope against the single shared axios instance.
 */
export interface MealsApiBundle {
  plansApi: PlansApi;
  mealsApi: MealsApi;
  receiptsApi: ReceiptsApi;
  familyGroupApi: FamilyGroupApi;
  authApi: AuthenticationApi;
  calendarApi: CalendarApi;
}

export function createMealsApi({
  baseUrl,
  configuration,
  axiosInstance,
}: ApiClientConfig): MealsApiBundle {
  // Every SDK class extends BaseAPI(configuration?, basePath, axios), so the
  // injected config flows uniformly into all of them — cookie vs bearer is
  // already decided inside `configuration`/`axiosInstance`.
  return {
    plansApi: new PlansApi(configuration, baseUrl, axiosInstance),
    mealsApi: new MealsApi(configuration, baseUrl, axiosInstance),
    receiptsApi: new ReceiptsApi(configuration, baseUrl, axiosInstance),
    familyGroupApi: new FamilyGroupApi(configuration, baseUrl, axiosInstance),
    authApi: new AuthenticationApi(configuration, baseUrl, axiosInstance),
    calendarApi: new CalendarApi(configuration, baseUrl, axiosInstance),
  };
}

/**
 * The generated DTOs type date fields as `Date`, but the server speaks
 * LocalDate (`YYYY-MM-DD`) and every date crosses the wire as a formatted
 * string. These two helpers are pure and platform-agnostic, so they live in
 * core: `formatDate` is the canonical day key, and `asApiDate` is the cast that
 * lets a formatted string satisfy the generated `Date` parameter type.
 */
export const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export const asApiDate = (date: Date): Date => formatDate(date) as unknown as Date;
