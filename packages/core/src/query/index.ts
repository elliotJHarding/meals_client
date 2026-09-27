// Server-state layer for the shared core: an injectable api-client seam, a
// QueryClient factory + provider, and the TanStack Query hooks that back every
// read/write. Rendering-agnostic (no DOM / react-dom imports) so web and native
// consume the same hooks against their own platform-built api client.

export {
  createMealsApi,
  formatDate,
  asApiDate,
  type ApiClientConfig,
  type MealsApiBundle,
} from './api-client';
export { queryKeys } from './keys';
export {
  createQueryClient,
  MealsApiProvider,
  useMealsApi,
} from './provider';

export {
  useWeekPlans,
  useWeekPlansQuery,
  useSavePlan,
  invalidateWeek,
  type SaveState,
} from './useWeekPlans';
export { useMeals } from './useMeals';
export {
  useReceipts,
  useIngestReceipt,
  ingestErrorMessage,
  IngestReceiptRequestFormatEnum,
  type UploadState,
  type IngestReceiptInput,
} from './useReceipts';
export {
  useFamilyGroup,
  useCreateFamilyGroup,
  useJoinFamilyGroup,
} from './useFamilyGroup';
export {
  useCalendarAuthorized,
  useCalendars,
  useCalendarEvents,
  useUpdateActiveCalendars,
  useLinkCalendar,
  useCalendarAuthUrl,
  sortCalendarEvents,
  eventsForDay,
} from './useCalendar';
