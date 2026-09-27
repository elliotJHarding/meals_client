import { createWebApiClient, webTokenStorage, type AuthAdapters } from '@meals_client/core';

// The single web platform adapter, built once at module scope — mirroring the
// old api/client.ts which constructed one shared axios instance for the whole
// app. createWebApiClient reproduces that exactly: axios.create({ baseURL,
// withCredentials: true }) + new Configuration({ basePath }). Cookie session
// auth, no bearer token, no interceptor — identical transport behaviour.
//
// Both the server-state layer (MealsApiProvider) and the auth orchestration
// (AuthProvider) are handed THIS SAME config so they share one axios instance
// and therefore one cookie jar, just as the old api/*.ts modules all shared the
// single client.ts instance.
const baseUrl: string = import.meta.env.VITE_REPOSITORY_URL;

export const apiClientConfig = createWebApiClient(baseUrl);

// Web stores no session token (the cookie is the session), so the auth
// orchestration is given the no-op web token storage.
export const authAdapters: AuthAdapters = {
  apiClient: apiClientConfig,
  tokenStorage: webTokenStorage,
};
