// Auth now lives in @meals_client/core: AuthProvider is the rendering-agnostic
// React shell driven by the AuthOrchestrator, wired in main.tsx with the web
// platform adapters (cookie session, no-op token storage). This module re-exports
// the same useAuth / AuthProvider surface so the existing view imports
// (`from './AuthContext'`) keep working unchanged; the AuthState shape is
// identical to the one that lived here.
export { useAuth, AuthProvider, type AuthState } from '@meals_client/core';
