// The api transport now lives in @meals_client/core (createWebApiClient builds
// the single cookie-session axios instance, see src/platform/webPlatform.ts).
// This module survives only as the import site for the pure date helpers that
// view code already references — re-exported from core so there is one
// implementation shared by web and native.
export { formatDate, asApiDate } from '@meals_client/core';
