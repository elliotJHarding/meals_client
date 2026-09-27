# Auth — provisional, pending spike (Phase 3)

These items are flagged by the Phase 3 auth spike (`/SPIKE_AUTH.md` at the workspace root)
and are NOT yet wired for real (that is Phase 4). Do not treat them as working config.

## iOS bundle ID is a PLACEHOLDER

`app.json` → `ios.bundleIdentifier = "com.harding.meals-ios-client"` is a placeholder and
**no iOS OAuth client is provisioned**. USER TODO before iOS sign-in can work:
- provision an iOS-type OAuth client (bundle id) in the same Google Cloud project,
- set the final iOS bundle identifier,
- replace the google-signin plugin placeholder `iosUrlScheme`
  (`com.googleusercontent.apps.<YOUR_IOS_CLIENT_ID>`) with the real reversed iOS client id.

## google-signin plugin config is PROVISIONAL

The `@react-native-google-signin/google-signin` app.json plugin entry (added in Phase 2)
carries the placeholder `iosUrlScheme` above. The runtime `GoogleSignin.configure({...})`
values are not added yet; Phase 4 will set them per `/SPIKE_AUTH.md` §6:
- `webClientId` MUST equal the server's `oauth.googleClientId` (the single WEB OAuth client),
- `offlineAccess: true` (returns the serverAuthCode the server exchanges),
- the three scopes: `calendar.readonly`, `cloud-platform`, `generative-language.retriever`.

Android (`android.package = com.harding.meals_android_client`) is provisioned and is
attestation-only — never sent to the token endpoint.

See `/SPIKE_AUTH.md` for the full design and the user-run proof procedure.
