import axios from 'axios';
import { Configuration } from '@elliotJHarding/meals-api';
import type { ApiClientConfig, TokenStorage } from './adapters';

/**
 * Web platform adapters: cookie-session auth and a no-op token store.
 *
 * This lives in core for now (clearly fenced in its own file) so Phase 1 can wire
 * the web app to the shared orchestration in one place and prove parity. It is a
 * candidate to move into apps/web at the wire stage — it is the only file here
 * that bakes in a web-specific transport decision (withCredentials), so keeping
 * it separable keeps that move a single-file relocation with no change to the
 * orchestration or adapter interfaces.
 *
 * It reproduces apps/web/src/api/client.ts exactly: one shared axios instance
 * with `withCredentials: true` (so the server's session cookie is replayed) and a
 * `Configuration` that only overrides `basePath`. There is no bearer token, no
 * interceptor, and no global error handling — auth is entirely the cookie.
 *
 * `baseUrl` is passed in rather than read from `import.meta.env` so this module
 * stays free of Vite-only globals and typechecks inside the core package; the web
 * app supplies `import.meta.env.VITE_REPOSITORY_URL`.
 */
export function createWebApiClient(baseUrl: string): ApiClientConfig {
  const axiosInstance = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
  });
  const configuration = new Configuration({ basePath: baseUrl });
  return { baseUrl, configuration, axiosInstance };
}

/**
 * Web has no token to store — the session is a cookie the browser owns. `get`
 * returns null (so a bearer-reading API client, if ever pointed at web config,
 * simply sends no Authorization header) and set/clear are no-ops.
 */
export const webTokenStorage: TokenStorage = {
  get: async () => null,
  set: async () => {},
  clear: async () => {},
};
