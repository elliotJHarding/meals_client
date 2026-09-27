# meals_client_v2

The Meals 2.0 client: a mobile-first week planner and meal library. See `../SPEC.md`
for the full vision. Replaces the shared Google Keep note — free-text meals under
real dates, shared across the family group.

## Setup

The generated API client is consumed as a local file dependency until meals_model
1.0.3 is released to GitHub Packages:

```
cd ../meals_model && ./gradlew prepareTypeScriptPackage
cd build/typescript-package && npm install && npm run build
cd ../../../meals_client_v2 && npm install
```

Once 1.0.3 is released, swap the `@elliotJHarding/meals-api` dependency in
package.json to the registry version and add the `.npmrc` GitHub Packages config
(same as meals_web_client).

Set `VITE_GOOGLE_CLIENT_ID` in `.env.development.local` (same value as the v1
client; required for login).

## Run

```
npm run dev
```

Serves on port 5173 — the only localhost origin authorised on the Google OAuth
client, so the v1 dev server can't run at the same time. To run both, authorise
http://localhost:5174 in Google Cloud Console and change the port back in
vite.config.ts (backend CORS already allows both ports). Expects meals_server
on http://localhost:8080.
