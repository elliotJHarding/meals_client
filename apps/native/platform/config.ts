import Constants from 'expo-constants';

/**
 * Runtime config the native auth/api layer needs, read once from the Expo app
 * config `extra` block (see app.json -> expo.extra). NOTHING here is hardcoded:
 * both values come from EXPO_PUBLIC_* env vars threaded through `extra` so a real
 * client id / API host never lives in committed source.
 *
 * webClientId — the Google *Web* OAuth client id. This MUST equal the server's
 * `oauth.googleClientId` (the single WEB OAuth client). The native serverAuthCode
 * is exchanged server-side against that same web client (client id + secret), so
 * a mismatch makes the offline grant fail with invalid_client. The Android app is
 * attested by its package + SHA-1 and its android-type client id is NEVER sent to
 * the token endpoint — only the web client id is configured here.
 */
function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * The Google Web OAuth client id. Required for `offlineAccess` (serverAuthCode)
 * sign-in. Missing here means the app config did not thread
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID into `extra` — sign-in cannot work, so we fail
 * loud rather than silently configuring an unusable GoogleSignin.
 */
export function googleWebClientId(): string {
  const id = readExtra('googleWebClientId');
  if (!id) {
    throw new Error(
      'Missing googleWebClientId. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and ensure ' +
        'app.json expo.extra.googleWebClientId reads it. It MUST equal the server ' +
        "oauth.googleClientId (the WEB OAuth client).",
    );
  }
  return id;
}

/**
 * Base URL of the meals server API (the `/api` context path included). Read from
 * EXPO_PUBLIC_API_BASE_URL via `extra`; defaults to the local dev server so the
 * app runs against the standard local stack without extra config.
 */
export function apiBaseUrl(): string {
  return readExtra('apiBaseUrl') ?? 'http://localhost:8080/api';
}
