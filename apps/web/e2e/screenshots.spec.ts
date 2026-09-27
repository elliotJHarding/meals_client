import { test } from './fixtures';
import { loginAsDevUser } from './helpers';

/**
 * Visual review aid, not an assertion suite: captures each screen to
 * .screenshots/. Run with: SCREENSHOTS=1 npx playwright test screenshots
 */

test.skip(() => !process.env.SCREENSHOTS, 'screenshots on demand only');

test('capture screens', async ({ context, page, weekPage, shopPage, libraryPage }) => {
  await page.goto('/login');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '.screenshots/login.png' });

  await loginAsDevUser(context, 'e2e-shop@test.local');
  await weekPage.gotoWeekWithSubtitle('1 – 7 June 2026');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '.screenshots/week.png' });

  await libraryPage.goto();
  await page.waitForTimeout(700);
  await page.screenshot({ path: '.screenshots/library.png' });

  await shopPage.goto();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '.screenshots/shop.png' });
});
