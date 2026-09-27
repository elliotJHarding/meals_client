import {
  GoogleSignin,
  isSuccessResponse,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';
import { AuthenticationApi, type LoginRequest } from '@elliotJHarding/meals-api';
import type { ApiClientConfig } from '@meals_client/core';
import { googleWebClientId } from './config';
import { storeTokenPair } from './tokenStore';

/**
 * Native Google Sign-In + server login.
 *
 * This owns the one part of the login the shared core CANNOT do: core's
 * AuthOrchestrator.login posts only `{ token }`, but the native offline grant
 * needs `{ token, authCode }` (the server exchanges the serverAuthCode for an
 * offline refresh token). So native performs the authCode-bearing /auth/login
 * itself and persists the returned JWT pair; the AuthProvider's whoAmI() then
 * reflects the new session. Core still owns whoAmI (bootstrap) and logout.
 *
 * The three scopes match the server's GoogleAuthService.SCOPES exactly so the
 * offline grant requested at login and the one requested by linkCalendar are
 * identical (no scope clobber): calendar.readonly, cloud-platform,
 * generative-language.retriever.
 */
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/generative-language.retriever',
];

let configured = false;

/**
 * Configure GoogleSignin once. `offlineAccess: true` is what makes signIn() return
 * a serverAuthCode; `webClientId` is the server's WEB OAuth client (read from
 * config, never hardcoded) and is the client the serverAuthCode is exchanged
 * against server-side.
 */
export function configureGoogleSignin(): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: googleWebClientId(),
    offlineAccess: true,
    scopes: SCOPES,
  });
  configured = true;
}

/** The user cancelled the Google sign-in sheet — distinct from a real failure. */
export class SignInCancelledError extends Error {
  constructor() {
    super('Google sign-in cancelled');
    this.name = 'SignInCancelledError';
  }
}

/**
 * Run the native sign-in and the authCode-bearing server login.
 *
 * Resolves with the Google idToken (the credential the AuthProvider then feeds to
 * its own login() to sync the user). Throws {@link SignInCancelledError} if the
 * user dismissed the sheet, and any other error for a real failure.
 *
 * Steps:
 *  1. native sign-in -> { idToken, serverAuthCode } (one consent for identity +
 *     offline access);
 *  2. POST /auth/login { token: idToken, authCode: serverAuthCode } as a mobile
 *     client -> JWT pair (the server also best-effort exchanges serverAuthCode for
 *     the offline refresh token);
 *  3. store the JWT access+refresh pair so every subsequent request authenticates.
 */
export async function signInAndAuthorise(
  apiClient: ApiClientConfig,
): Promise<string> {
  configureGoogleSignin();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (isCancelledResponse(response)) {
    throw new SignInCancelledError();
  }
  if (!isSuccessResponse(response)) {
    throw new Error('Google sign-in did not complete');
  }

  const { idToken, serverAuthCode } = response.data;
  if (!idToken) {
    throw new Error('Google sign-in returned no idToken');
  }

  const authApi = new AuthenticationApi(
    apiClient.configuration,
    apiClient.baseUrl,
    apiClient.axiosInstance,
  );

  const request: LoginRequest = {
    token: idToken,
    // serverAuthCode is null only if offlineAccess/webClientId were misconfigured;
    // send it when present so the server can grant offline access.
    authCode: serverAuthCode ?? undefined,
  };

  const login = await authApi.login(request);
  // The mobile login response is the token-bearing LoginResponse. Persist both
  // halves; the access token authenticates requests, the refresh token feeds the
  // 401 refresh interceptor.
  const data = login.data as { accessToken?: string; refreshToken?: string };
  if (data.accessToken && data.refreshToken) {
    await storeTokenPair(data.accessToken, data.refreshToken);
  }

  return idToken;
}
