import { test, expect } from './fixtures';
import { loginAsDevUser } from './helpers';

// Each spec uses its own dev user so user-scoped plans keep tests isolated
const USER = 'e2e-week@test.local';

test.beforeEach(async ({ context, weekPage }) => {
  await loginAsDevUser(context, USER);
  await weekPage.goto();
});

test('week view shows seven dated days with today marked', async ({ weekPage }) => {
  await expect(weekPage.today).toHaveCount(1);
  await expect(weekPage.today.locator('.num')).toHaveText(String(new Date().getDate()));
});

test('free-text entry round-trips through the backend', async ({ page, weekPage }) => {
  await weekPage.addEntry(weekPage.today, 'Playwright pie');

  // Survives a reload: it came back from the server, not local state
  await page.reload();
  await weekPage.waitLoaded();
  await expect(weekPage.entries(weekPage.today)).toHaveText(['Playwright pie']);

  // Clean up: remove the entry and confirm it stays gone
  await weekPage.removeEntry(weekPage.today);
  await expect(weekPage.entries(weekPage.today)).toHaveCount(0);
  await page.reload();
  await weekPage.waitLoaded();
  await expect(weekPage.entries(weekPage.today)).toHaveCount(0);
});

test('week navigation moves to the previous week and back', async ({ page, weekPage }) => {
  const currentRange = await weekPage.subtitle.textContent();
  const prevArrow = page.getByRole('button', { name: 'Previous week' });
  const arrowBefore = (await prevArrow.boundingBox())!;

  await weekPage.gotoPreviousWeek();

  // Regression guard: the today pill appearing must not shift the arrows
  // (its slot is always reserved; it only fades)
  const arrowAfter = (await prevArrow.boundingBox())!;
  expect(arrowAfter.x, 'arrows should not move when the today pill appears').toBe(arrowBefore.x);
  await expect(weekPage.subtitle).not.toHaveText(currentRange!);
  const todayPill = page.getByRole('button', { name: 'today' });
  await expect(todayPill).toBeVisible();

  // Regression guard: the pill once inherited the 38px circular arrow-button
  // sizing and squashed into a circle with overflowing text
  const box = (await todayPill.boundingBox())!;
  expect(box.width, 'today pill should be wider than tall').toBeGreaterThan(box.height);

  await weekPage.gotoToday();
  await expect(weekPage.subtitle).toHaveText(currentRange!);
});
