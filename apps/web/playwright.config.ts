import { defineConfig, devices } from '@playwright/test';

// Runs against the already-running local stack: client on 5173, server on
// 8080 (localdev profile for /auth/dev-login), AI service on 8000.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    ...devices['iPhone 13'],
    // Mobile Safari device preset but chromium engine: keep it simple locally
    browserName: 'chromium',
  },
  reporter: [['list']],
});
