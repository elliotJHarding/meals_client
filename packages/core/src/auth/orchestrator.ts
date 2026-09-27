import {
  AuthenticationApi,
  type AppUserDto,
  type LoginRequest,
  type TokenResponse,
} from '@elliotJHarding/meals-api';
import type { ApiClientConfig, TokenStorage } from './adapters';

/**
 * Rendering-agnostic auth orchestration.
 *
 * This is the auth *flow* lifted out of apps/web/src/auth/AuthContext.tsx and
 * apps/web/src/api/auth.ts with the web-specific bits (React, the cookie/token
 * decision, the Google widget) replaced by injected adapters. It is plain async
 * functions — no React, no react-dom, no @react-oauth/google — so the same code
 * drives the web provider and the future native provider.
 *
 * Three behaviours are deliberately preserved exactly from the web source:
 *  1. login() trusts whoAmI(), not the login response, for the current user —
 *     the login response shape varies between session and token clients
 *     (Login200Response = AppUserDto | LoginResponse). (auth.ts:6-11)
 *  2. whoAmI() maps 401/403 to null (= logged out) and rethrows anything else.
 *     (auth.ts:13-24)
 *  3. logout() is best-effort: it swallows the 401/403 that Spring Security's
 *     logout filter produces (302 -> /login?logout -> 401 on the secured API,
 *     which axios follows and rejects *after* the session is already gone).
 *     (auth.ts:26-39)
 */
export class AuthOrchestrator {
  private readonly api: AuthenticationApi;
  private readonly tokenStorage: TokenStorage;

  constructor(apiClient: ApiClientConfig, tokenStorage: TokenStorage) {
    // Same construction shape every api/*.ts module uses on web:
    // new XApi(configuration, baseUrl, axiosInstance).
    this.api = new AuthenticationApi(
      apiClient.configuration,
      apiClient.baseUrl,
      apiClient.axiosInstance,
    );
    this.tokenStorage = tokenStorage;
  }

  /**
   * Exchange a Google credential for a session, then resolve the current user.
   *
   * The login response is intentionally ignored for the user identity — whoAmI()
   * is the single source of truth across both session-cookie (web) and bearer
   * (native) clients. On native the login response *also* carries a bearer token
   * (TokenResponse), which we persist so subsequent requests authenticate; on web
   * the response is the user and there is no token, so the persist is a no-op.
   *
   * Note: the generated LoginRequest is `{ token: string }`, so the web code's
   * `as never` cast (auth.ts:9) is unnecessary here — we pass a correctly typed
   * request. The looseness the cast hinted at is the *response* union, handled by
   * deferring to whoAmI().
   */
  async login(googleCredential: string): Promise<AppUserDto | null> {
    const request: LoginRequest = { token: googleCredential };
    const response = await this.api.login(request);
    await this.persistBearerTokenIfPresent(response.data);
    return this.whoAmI();
  }

  /**
   * The currently authenticated user, or null if logged out.
   *
   * 401/403 means "not logged in" and maps to null; any other error is a real
   * failure and propagates. This null-on-unauthorised mapping is shared logic and
   * is what the bootstrap and post-login flows both rely on.
   */
  async whoAmI(): Promise<AppUserDto | null> {
    try {
      const response = await this.api.whoAmI();
      return response.data;
    } catch (error: unknown) {
      if (isUnauthorised(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Best-effort logout. The network call may reject with 401/403 because the
   * server clears the session and then redirects onto a secured endpoint; that
   * rejection is expected and swallowed. Any stored bearer token is cleared
   * regardless so the client cannot stay authenticated.
   *
   * The caller (the provider) drops the local user in its own `finally`, so even
   * a non-401/403 throw here does not leave the UI logged in — but we still clear
   * the token before rethrowing so the credential never outlives the intent.
   */
  async logout(): Promise<void> {
    try {
      await this.api.logout();
    } catch (error: unknown) {
      if (!isUnauthorised(error)) {
        await this.tokenStorage.clear();
        throw error;
      }
    }
    await this.tokenStorage.clear();
  }

  /**
   * The login response is a union (AppUserDto | LoginResponse). Only the
   * token-client variant carries a bearer token; persist it when present so the
   * native API client's `accessToken` function can read it back. On web the
   * response is the user with no token, so nothing is stored.
   */
  private async persistBearerTokenIfPresent(responseData: unknown): Promise<void> {
    const token = (responseData as Partial<TokenResponse> | null)?.accessToken;
    if (typeof token === 'string' && token.length > 0) {
      await this.tokenStorage.set(token);
    }
  }
}

/** True for the HTTP 401/403 that both whoAmI and logout treat as "not authed". */
function isUnauthorised(error: unknown): boolean {
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 401 || status === 403;
}
