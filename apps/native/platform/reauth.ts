/**
 * The re-auth surface.
 *
 * Some auth failures originate OUTSIDE React — the axios refresh interceptor runs
 * for any request and, when the refresh token itself is rejected (the JWT
 * equivalent of Google's invalid_grant), there is no component on the stack to
 * throw into. The SPEC principle is that this must never fail silently: the user
 * has to be told to re-connect Google rather than seeing requests quietly error.
 *
 * This is a tiny synchronous event hub: the interceptor calls
 * `signalReauthRequired()`, and the auth layer subscribes to drive the UI back to
 * the sign-in screen with a clear "session expired, sign in again" state. It is
 * deliberately framework-free (no React) so the non-React interceptor can call it.
 */
type ReauthListener = (reason: ReauthReason) => void;

/**
 * Why re-auth is being requested. Currently the only cause is a rejected refresh
 * token (the JWT equivalent of invalid_grant), fired by the api-client's 401
 * interceptor — that is the only failure with no React component on the stack to
 * surface it.
 *  - 'refresh-failed'  the stored refresh token was rejected (session expired).
 *
 * Note: a revoked Google *offline grant* (calendar/AI need re-consent while
 * identity is still fine) is NOT signalled here — it surfaces in-app via the
 * Profile reconnect (useCalendarAuthorized -> "Reconnect Google"), not via this
 * sign-out hub. Add a variant here only if a non-React path needs to force re-auth
 * specifically for the offline grant.
 */
export type ReauthReason = 'refresh-failed';

const listeners = new Set<ReauthListener>();

/** Subscribe to re-auth requests. Returns an unsubscribe function. */
export function onReauthRequired(listener: ReauthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Fire a re-auth request to every subscriber. Safe to call from non-React code. */
export function signalReauthRequired(reason: ReauthReason): void {
  for (const listener of listeners) {
    listener(reason);
  }
}
