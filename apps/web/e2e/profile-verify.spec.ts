import { test, expect } from './fixtures';
import { loginAsDevUser } from './helpers';

// Owns a per-spec dev user (no pictureUrl, no family group yet) so the
// assertions are deterministic regardless of seed data. "Dev profile" → "DP".
test('avatar in nav, profile page, logout', async ({ context, page }) => {
  await loginAsDevUser(context, 'profile@test.local');
  await page.goto('/');

  // Avatar appears as the fourth nav item ("you"), initials fallback.
  const youTab = page.locator('.bottom-nav a', { hasText: 'you' });
  await expect(youTab).toBeVisible();
  await expect(youTab.locator('.avatar-initials')).toHaveText('DP');

  // Navigate to the profile.
  await youTab.click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator('.profile-identity h1')).toHaveText('Dev profile');

  // Family group section renders with its invite affordance.
  await expect(page.locator('.profile-section', { hasText: 'family group' })).toBeVisible();
  await expect(page.locator('.pill', { hasText: 'invite someone' })).toBeVisible();

  // Calendar is not connected locally → "connect" affordance shows.
  await expect(page.locator('.status-dot.off')).toBeVisible();
  await expect(page.locator('.pill', { hasText: 'connect google calendar' })).toBeVisible();

  // Sign out returns to the login screen (best-effort logout still navigates).
  await page.locator('.logout-pill').click();
  await expect(page).toHaveURL(/\/login$/);
});
