// Public API of @meals_client/core.
//
// The shared, rendering-agnostic core consumed by apps/web (and later
// apps/native): design tokens, the TanStack Query server-state layer, and the
// auth orchestration with its platform seams. Everything here is free of
// react-dom / browser globals — platform specifics are injected through the
// adapter interfaces re-exported below.

// Design tokens — the single source of truth mirrored from theme.css, plus the
// CSS-var name map a web emitter can use to regenerate :root.
export {
  palette,
  type,
  layout,
  tokens,
  cssVarNames,
  type Palette,
  type Type,
  type Layout,
  type Tokens,
  type PaletteToken,
  type TypeToken,
  type LayoutToken,
} from './tokens';

// Server-state layer: the api-client seam, the QueryClient factory + provider,
// the query/mutation hooks, and the date helpers / query keys they share.
export {
  createMealsApi,
  formatDate,
  asApiDate,
  type ApiClientConfig,
  type MealsApiBundle,
  queryKeys,
  createQueryClient,
  MealsApiProvider,
  useMealsApi,
  useWeekPlans,
  useWeekPlansQuery,
  useSavePlan,
  invalidateWeek,
  type SaveState,
  useMeals,
  useReceipts,
  useIngestReceipt,
  ingestErrorMessage,
  IngestReceiptRequestFormatEnum,
  type UploadState,
  type IngestReceiptInput,
  useFamilyGroup,
  useCreateFamilyGroup,
  useJoinFamilyGroup,
  useCalendarAuthorized,
  useCalendars,
  useCalendarEvents,
  useUpdateActiveCalendars,
  useLinkCalendar,
  useCalendarAuthUrl,
  sortCalendarEvents,
  eventsForDay,
} from './query';

// Auth: the platform-agnostic orchestration + React shell, the platform seam
// interfaces, and the web adapter implementations (cookie session).
export {
  AuthOrchestrator,
  AuthProvider,
  useAuth,
  type AuthState,
  type AuthProviderProps,
  type TokenStorage,
  type AuthCredentialProvider,
  type AuthAdapters,
  createWebApiClient,
  webTokenStorage,
} from './auth';
