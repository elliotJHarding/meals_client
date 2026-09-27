import type { AuthAdapters, AuthCredentialProvider } from '@meals_client/core';
import { createNativeApiClient } from './apiClient';
import { secureTokenStorage } from './tokenStore';
import { signInAndAuthorise } from './googleAuth';

/**
 * The native platform seam: the concrete implementations of core's adapter
 * interfaces, assembled once and handed to MealsApiProvider + AuthProvider in
 * app/_layout.tsx — exactly as apps/web does with its webPlatform module.
 *
 * Built once at module scope so the single axios instance (one bearer/refresh
 * pipeline) and one Configuration are shared by the server-state hooks and the
 * auth orchestration, mirroring the web app's single shared client.
 */
export const apiClientConfig = createNativeApiClient();

/**
 * The credential provider is the imperative escape hatch core defines for
 * platforms that obtain a credential outside a React widget. On native, obtaining
 * the credential is the WHOLE login: it runs native Google sign-in and the single
 * authCode-bearing /auth/login, and stores the JWT pair (core's orchestrator can
 * only post `{ token }`, never the authCode the offline grant needs, so the login
 * cannot go through orchestrator.login).
 *
 * The login screen therefore calls this provider (one /auth/login, with authCode)
 * and then `useAuth().refreshUser()`, which syncs core's user state via whoAmI
 * against the now-stored bearer token — no second /auth/login. The same provider
 * backs the Profile "Reconnect Google" action, which re-runs it to refresh the
 * offline grant. It still returns the idToken for callers that want it.
 */
export const credentialProvider: AuthCredentialProvider = {
  obtainCredential: () => signInAndAuthorise(apiClientConfig),
};

/**
 * The full adapter bundle for AuthProvider. Token storage is SecureStore (the
 * access-token half core reads); the api client is the bearer/refresh instance.
 */
export const authAdapters: AuthAdapters = {
  apiClient: apiClientConfig,
  tokenStorage: secureTokenStorage,
  credentialProvider,
};
