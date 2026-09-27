import type { AxiosInstance } from 'axios';
import type { Configuration } from '@elliotJHarding/meals-api';

/**
 * Platform seams for auth and the API client.
 *
 * Core's auth orchestration is rendering-agnostic: it knows the *flow* (bootstrap
 * the current user, exchange a credential for a session, drop the session on
 * logout) but nothing about *where the session lives* or *how a credential is
 * produced*. Those differ per platform and are injected through the interfaces
 * below.
 *
 * Evidence for the split (see apps/web/src/auth + apps/web/src/api/auth.ts):
 *  - Web authenticates by session cookie: `axios.create({ withCredentials: true })`
 *    sends the server's cookie, there is no token to store, and the sign-in
 *    credential comes from the @react-oauth/google <GoogleLogin> widget.
 *  - Native will authenticate by bearer token: it stores the token in SecureStore
 *    and feeds it to the generated `Configuration` via `accessToken`/`baseOptions`,
 *    and produces the credential from a native Google Sign-In.
 *
 * None of those concrete dependencies (react-dom, @react-oauth/google,
 * expo-secure-store, window.location) may be imported by the orchestration — they
 * live behind these adapters.
 */

/**
 * Where the session lives.
 *
 * Web: no-op — the session is a cookie the browser holds and `withCredentials`
 * replays automatically, so `get` returns null and `set`/`clear` do nothing.
 *
 * Native: expo-secure-store — `get` is consumed by the API client's `accessToken`
 * function (so every request carries `Authorization: Bearer <token>`), `set` after
 * a successful login, `clear` on logout.
 */
export interface TokenStorage {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Configuration the API client is built from. This is the single seam that lets
 * the same generated SDK speak cookie-auth on web and bearer-auth on native
 * without any SDK change — the generated `Configuration` already exposes
 * `accessToken` (sync/async) and `baseOptions` (spread into every request).
 *
 *  - Web supplies:    axios.create({ baseURL, withCredentials: true })
 *                     + new Configuration({ basePath: baseUrl })
 *  - Native supplies: axios.create({ baseURL })
 *                     + new Configuration({ basePath: baseUrl,
 *                         accessToken: () => tokenStorage.get(),
 *                         baseOptions: { headers: { Authorization: `Bearer …` } } })
 */
export interface ApiClientConfig {
  baseUrl: string;
  configuration: Configuration;
  axiosInstance: AxiosInstance;
}

/**
 * Produces a Google credential string for {@link AuthOrchestrator.login}.
 *
 * The credential *production* is the platform seam; what core does with the
 * resulting string (POST it to /login, then whoAmI) is shared.
 *
 *  - Web: the @react-oauth/google <GoogleLogin> widget yields
 *    `credentialResponse.credential` (a Google ID token / JWT).
 *  - Native: a native Google Sign-In yields a credential / serverAuthCode.
 *
 * The login *view* (the widget itself) stays in the platform app; this interface
 * is only the imperative escape hatch for platforms that obtain a credential
 * outside a React widget. Web's primary path is the widget calling `login()`
 * directly, so a web implementation of this is optional.
 */
export interface AuthCredentialProvider {
  /** Trigger the platform sign-in and resolve with the raw Google credential. */
  obtainCredential(): Promise<string>;
}

/**
 * The full set of adapters the auth provider needs. Only {@link TokenStorage}
 * and {@link ApiClientConfig} are required by the orchestration itself;
 * {@link AuthCredentialProvider} is optional because the web sign-in widget calls
 * `login(credential)` imperatively rather than going through the provider.
 */
export interface AuthAdapters {
  tokenStorage: TokenStorage;
  apiClient: ApiClientConfig;
  credentialProvider?: AuthCredentialProvider;
}
