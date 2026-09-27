import { BrowserContext, expect } from '@playwright/test';

export const API_URL = 'http://localhost:8080/api';

/**
 * Establish a session via the localdev-only dev-login endpoint. The session
 * cookie lands in the browser context's cookie jar (shared with
 * context.request), so subsequent app API calls are authenticated.
 */
export async function loginAsDevUser(context: BrowserContext, email: string): Promise<void> {
  const response = await context.request.post(
    `${API_URL}/auth/dev-login?email=${encodeURIComponent(email)}`,
  );
  expect(response.ok(), `dev-login failed: ${response.status()}`).toBeTruthy();
}
