/**
 * Shared auth surface for the core package.
 *
 * Orchestration (platform-agnostic):
 *  - AuthOrchestrator — the login/logout/whoAmI flow over the generated SDK.
 *  - AuthProvider / useAuth / AuthState — the React shell, no react-dom or
 *    sign-in-widget dependency.
 *
 * Platform seams (interfaces):
 *  - TokenStorage, ApiClientConfig, AuthCredentialProvider, AuthAdapters.
 *
 * Web adapter implementation (cookie session; movable to apps/web later):
 *  - createWebApiClient, webTokenStorage.
 *
 * The top-level src/index.ts is assembled in the wire stage and is intentionally
 * not touched here; consumers can import from '@meals_client/core/.../auth' via
 * this barrel until then.
 */
export { AuthOrchestrator } from './orchestrator';
export { AuthProvider, useAuth } from './AuthProvider';
export type { AuthState, AuthProviderProps } from './AuthProvider';
export type {
  TokenStorage,
  ApiClientConfig,
  AuthCredentialProvider,
  AuthAdapters,
} from './adapters';
export { createWebApiClient, webTokenStorage } from './webAdapters';
