import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5173: the only localhost origin authorised on the Google OAuth client.
// Means the v1 client dev server can't run at the same time; authorise
// localhost:5174 in Google Cloud Console if that's ever needed.
// strictPort stops vite silently moving to an unauthorised port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
