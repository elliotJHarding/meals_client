# Native deep links

How `grub://` links reach a screen, what works today, and the decisions taken.

## How linking is wired

expo-router owns linking. It derives the `grub://` URL prefix from `app.json`'s
`"scheme": "grub"`, so there is **no** manual `linking` / `prefixes` /
`getStateFromPath` config anywhere (none in `app.json` or an `app.config.js`).
Routes are filesystem-routed under `app/`, so a file at `app/join/[uuid].tsx`
auto-creates both the in-app route `/join/:uuid` and the external deep link
`grub://join/<uuid>`.

`app/+native-intent.ts` (`redirectSystemPath`) is the single interception point
for every incoming system URL, cold-start and warm. It only rewrites the
expo-share-intent `dataUrl=<shareExtensionKey>` URL to `/share`; everything else
(including join) falls through unchanged and expo-router resolves it.

Cold start (app launched by the link) is handled by expo-router automatically:
it runs `redirectSystemPath` for the launch URL with `initial: true` and mounts
the matched route. The only join-specific cold-start concern is auth timing —
`useAuth().loading` is true until `whoAmI` resolves, so the join screen waits
for `loading === false` before deciding authenticated-vs-resume, and the
AuthGate likewise suppresses navigation while loading.

## Links that work now (scheme-based, in-repo)

| Link | Route | Behaviour |
|---|---|---|
| `grub://join/<uuid>` | `app/join/[uuid].tsx` | Joins the family group identified by `<uuid>` via the core `useJoinFamilyGroup` mutation, then routes to the Profile tab. If signed out, the uuid is parked (`platform/pendingJoin.ts`), the AuthGate sends the user to `/login`, and after sign-in the AuthGate resumes by routing back to `/join/<uuid>` so the invite is honoured rather than dropped. A once-only ref guards the mutation. Missing/invalid uuid shows an error with a route back. |
| `grub://share` (via `dataUrl=` redirect) | `app/share.tsx` | Receipt ingestion from the OS share sheet. Pre-existing; delivered by the expo-share-intent ACTION_SEND filters. |

Manual test once the dev/standalone build is installed:

```
npx uri-scheme open "grub://join/REPLACE-WITH-A-REAL-UUID" --android   # or --ios
```

## Offline-consent callback: NOT NEEDED (superseded)

A native offline-consent **callback** deep link (the device analogue of web's
`CalendarLinkCallback`) is deliberately **not** implemented — it would be dead
code. Evidence:

- Web has `CalendarLinkCallback.tsx` only because web's consent is a browser
  full-page redirect: Google redirects back to a URL carrying `?code=`, the
  component reads `searchParams.get('code')` and calls
  `useLinkCalendar().mutateAsync(code)`. That open-consent-then-receive-the-code
  dance is a web/DOM seam.
- Native has no such seam. `components/profile/GoogleConnectionSection.tsx`
  `onReconnect()` does **not** open a browser or wait for a redirected `?code=`.
  It calls `credentialProvider.obtainCredential()` then invalidates the calendar
  queries (`queryKeys.calendar.authorized`, `queryKeys.calendar.list`).
- `obtainCredential` resolves to `signInAndAuthorise` (`platform/nativePlatform.ts`
  → `platform/googleAuth.ts`), which runs `GoogleSignin.signIn()` with
  `offlineAccess: true` and the calendar + Gemini scopes, then POSTs `/auth/login`
  with `{ token: idToken, authCode: serverAuthCode }`. The server exchanges the
  serverAuthCode for the offline refresh token. So the offline grant the nightly
  sweep / `invalid_grant` re-auth needs is re-established **inline** from the
  sign-in response — no OAuth redirect URI, no `code` query param, no callback
  route on the device.
- The login screen already requests these scopes at first sign-in, and
  `platform/reauth.ts` surfaces `'offline-invalid'` by routing to `/login`, where
  the same native sign-in reconnects. A second, calendar-link-specific callback
  would be redundant.

Reconnect path reachability (confirmed): `invalid_grant` / refresh failure →
axios interceptor calls `signalReauthRequired` → AuthGate's `onReauthRequired`
subscription routes to `/login`, and the login screen shows the
`'offline-invalid'` message; alternatively the Profile tab's
`GoogleConnectionSection` shows "Reconnect Google" whenever
`useCalendarAuthorized` is false. Both buttons run `obtainCredential`, which
re-grants offline access. No callback deep link participates.

## HTTPS universal / app links — Phase 8, external

Supporting `https://grubplanner.co.uk/join/<uuid>` (so the same link works in a
browser AND opens the app) needs more than the scheme, and all of it is
out-of-band — it requires control of the domain plus real signing identities,
none of which exist in-repo yet:

- **iOS Universal Links**: an Apple App Site Association (AASA) file served at
  `https://grubplanner.co.uk/.well-known/apple-app-site-association` listing the
  app's `appID` (`TEAMID.com.harding.meals-ios-client`), plus the
  `associatedDomains: ["applinks:grubplanner.co.uk"]` entitlement (declared via
  the expo `ios.associatedDomains` config). Blocked on a provisioned iOS team id
  / iOS OAuth client — still a placeholder per `AUTH_SPIKE_NOTES.md`.
- **Android App Links**: an `assetlinks.json` at
  `https://grubplanner.co.uk/.well-known/assetlinks.json` containing the package
  (`com.harding.meals_android_client`) and the **release** signing SHA-256
  fingerprint, plus an `autoVerify` VIEW intent filter for the https host.
  Blocked on the release keystore fingerprint.

In expo-router the https origins are added as link prefixes; the route tree
(`app/join/[uuid].tsx`) is unchanged, so the in-app handling above is already
ready for them.

## Removed: dead Android intent filter

`app.json` previously declared a standalone `android.intentFilters` entry —
`{ action: VIEW, category: [DEFAULT, BROWSABLE], data: { mimeType: "message/rfc822" } }`.
It was removed. It advertised Grub as a **handler/opener of .eml content** (an
ACTION_VIEW intent), a different gesture from sharing, and nothing routed it:
`+native-intent.ts` only matches the share `dataUrl=` key, and no route consumes
a VIEW of an email. Receipt ingestion via sharing is delivered by
expo-share-intent's own ACTION_SEND filters
(`androidIntentFilters: ["text/*", "message/rfc822"]`), which still land on
`/share`. The standalone VIEW filter was therefore redundant to the working
share path and was deleted rather than routed (no product goal to open a tapped
.eml file directly into ingestion).
