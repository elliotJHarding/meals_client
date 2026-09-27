import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Configuration, type TokenResponse } from '@elliotJHarding/meals-api';
import type { ApiClientConfig } from '@meals_client/core';
import { apiBaseUrl } from './config';
import {
  secureTokenStorage,
  getRefreshToken,
  storeTokenPair,
  clearTokens,
} from './tokenStore';
import { signalReauthRequired } from './reauth';

/**
 * Native bearer api-client, the native counterpart of core's createWebApiClient.
 *
 * Where web authenticates by replayed cookie (withCredentials), native carries a
 * bearer token and identifies itself as a mobile client so the server returns the
 * JWT token pair from /auth/login. Three transport concerns live here, none of
 * which exist on web:
 *  1. every request gets `Authorization: Bearer <accessToken>` (from SecureStore)
 *     and `X-Client-Type: mobile`;
 *  2. a 401 triggers a single refresh against /auth/refresh, stores the new pair,
 *     and retries the original request once;
 *  3. a failed refresh clears the tokens and raises the re-auth surface.
 *
 * The same `Configuration` object is also handed to core's MealsApiProvider and
 * AuthProvider, so its `accessToken` function is the single source the generated
 * SDK reads — but the live attaching/refresh is done on the shared axios instance
 * below, which every SDK class is constructed against.
 */

/** A request we have already retried once, so the interceptor won't loop. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

function createAxios(baseUrl: string): AxiosInstance {
  const instance = axios.create({ baseURL: baseUrl });

  // Attach the bearer token + mobile marker to every outgoing request. The token
  // is read fresh from SecureStore each time so a refresh mid-session is picked up
  // by subsequent requests without rebuilding the instance.
  instance.interceptors.request.use(async (config) => {
    config.headers.set('X-Client-Type', 'mobile');
    const token = await secureTokenStorage.get();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  // Refresh-on-401: one attempt, then retry the original request once. The
  // /auth/refresh call is made on a BARE axios (not `instance`) so it cannot be
  // intercepted/retried recursively and carries no stale Authorization header.
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const status = error.response?.status;

      if (status !== 401 || !original || original._retried) {
        return Promise.reject(error);
      }

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        // No way to recover — surface re-auth and propagate the original failure.
        await clearTokens();
        signalReauthRequired('refresh-failed');
        return Promise.reject(error);
      }

      try {
        const refreshed = await axios.post<TokenResponse>(
          `${baseUrl}/auth/refresh`,
          { refreshToken },
          { headers: { 'X-Client-Type': 'mobile' } },
        );
        const next = refreshed.data;
        if (!next.accessToken || !next.refreshToken) {
          throw new Error('refresh response missing tokens');
        }
        await storeTokenPair(next.accessToken, next.refreshToken);

        original._retried = true;
        original.headers.set('Authorization', `Bearer ${next.accessToken}`);
        return instance(original);
      } catch {
        // The refresh token itself is rejected — session is dead. Clear and
        // surface the re-connect-Google state rather than failing silently.
        await clearTokens();
        signalReauthRequired('refresh-failed');
        return Promise.reject(error);
      }
    },
  );

  return instance;
}

/**
 * Build the native ApiClientConfig. `accessToken` on the Configuration mirrors the
 * request interceptor (the SDK reads it for any code path that consults the
 * Configuration directly); the live header attaching + refresh is on the axios
 * instance shared by every SDK class.
 */
export function createNativeApiClient(): ApiClientConfig {
  const baseUrl = apiBaseUrl();
  const axiosInstance = createAxios(baseUrl);
  const configuration = new Configuration({
    basePath: baseUrl,
    accessToken: async () => (await secureTokenStorage.get()) ?? '',
  });
  return { baseUrl, configuration, axiosInstance };
}
