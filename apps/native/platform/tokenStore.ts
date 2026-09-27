import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@meals_client/core';

/**
 * Secure persistence for the bearer token pair.
 *
 * Core's {@link TokenStorage} seam covers exactly ONE token — the access token —
 * because that is all the orchestration reads (the api-client's `accessToken`
 * function and logout's `clear`). The refresh token has no core seam (web has no
 * tokens at all), so native owns it here alongside the access token, under its own
 * SecureStore key.
 *
 * Both live in expo-secure-store (Keychain on iOS, Keystore-backed on Android),
 * not AsyncStorage — they are credentials.
 */
const ACCESS_TOKEN_KEY = 'meals.accessToken';
const REFRESH_TOKEN_KEY = 'meals.refreshToken';

/**
 * The access-token half, shaped exactly as core's TokenStorage expects:
 *  - get()   feeds the api-client's `Configuration.accessToken` (every request's
 *            Authorization header)
 *  - set()   persists the token returned by /auth/login or /auth/refresh
 *  - clear() drops it on logout / refresh failure
 *
 * clear() also removes the refresh token, so a single core-driven logout cannot
 * leave a usable refresh token behind.
 */
export const secureTokenStorage: TokenStorage = {
  get: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

/** Read the stored refresh token, or null if none has been persisted. */
export function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/** Persist the refresh token (after login, or after a refresh rotates it). */
export function setRefreshToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/**
 * Persist a freshly-issued access+refresh pair together. Used by the login flow
 * and the refresh interceptor so both halves are always written as a unit.
 */
export async function storeTokenPair(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await secureTokenStorage.set(accessToken);
  await setRefreshToken(refreshToken);
}

/** Drop both tokens (logout, or unrecoverable refresh failure). */
export function clearTokens(): Promise<void> {
  return secureTokenStorage.clear();
}
