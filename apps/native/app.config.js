// Dynamic Expo config layered over app.json.
//
// app.json is static and does NOT expand environment variables, so the auth/api
// runtime values are threaded in here from process.env into `expo.extra`, where
// platform/config.ts reads them via Constants.expoConfig.extra. Expo merges this
// file's return value over app.json.
//
// EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID — the Google *Web* OAuth client id. It MUST be
// byte-for-byte equal to the server's oauth.googleClientId (the single WEB OAuth
// client): the native serverAuthCode is exchanged server-side against that same
// web client (id + secret), so a mismatch fails the offline grant with
// invalid_client. NEVER commit a real client id/secret — set it via the env var
// (e.g. an untracked .env / EAS secret). The Android app's own android-type client
// id is attestation-only (package + SHA-1) and is never configured here.
//
// EXPO_PUBLIC_API_BASE_URL — the meals server base URL including the /api context
// path. Defaults (in platform/config.ts) to the local dev server when unset.
//
// SHARE INTENT (receipt ingestion entry): the expo-share-intent plugin is wired
// in app.json. It ships native code, so it cannot run in Expo Go — the share
// feature needs a custom dev build (`npx expo prebuild` then `expo run:android` /
// `expo run:ios`, or an EAS dev-client). Android's ACTION_SEND text/* path works
// once prebuilt with android.package = com.harding.meals_android_client.
//
// TODO(iOS provisioning): the iOS share extension is NOT yet shippable. The app
// bundleIdentifier in app.json is still the placeholder
// com.harding.meals-ios-client, and the generated share extension needs its OWN
// registered bundle id (default <appId>.share-extension) plus a shared App Group
// (default group.<appId>), both provisioned in the Apple Developer account with
// the App Group capability before any EAS iOS build will succeed. Expo's
// appExtensions mechanism is experimental. There is no iOS client yet, so the
// iOS share path is unexercisable until that provisioning exists.

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
});
