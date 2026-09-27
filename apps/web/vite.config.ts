import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5173: the only localhost origin authorised on the Google OAuth client.
// Means the v1 client dev server can't run at the same time; authorise
// localhost:5174 in Google Cloud Console if that's ever needed.
// strictPort stops vite silently moving to an unauthorised port.
export default defineConfig({
  plugins: [react()],
  // preserveSymlinks: resolve a dependency's own imports from the symlink's
  // LOCATION, not its real path. Required for the hermetic Docker build: the
  // contract package (@elliotJHarding/meals-api) is a file: dep symlinked to
  // ../../../meals_model/build/typescript-package, OUTSIDE the workspace tree.
  // Its dist/esm imports `axios`; without this flag Rollup resolves that import
  // from the contract's real path, walks up to meals_model/ (no node_modules
  // there in the image — .dockerignore excludes the contract's own
  // node_modules) and fails with "Rollup failed to resolve import 'axios'".
  // With the flag, axios resolves through meals_client/node_modules, where the
  // workspace install always provides it. Applies to the dev server too; the
  // same resolution is used for the @meals_client/core workspace symlink.
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
