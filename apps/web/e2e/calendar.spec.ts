import { test, expect } from './fixtures';
import { loginAsDevUser } from './helpers';

// Own dev user keeps this spec isolated. A dev-login user has no stored Google
// offline token, so the server reports calendar access as not authorised — the
// locally-reachable calendar state is the connect prompt. Event rendering needs
// a really-linked Google calendar, which the local dummy-secret stack can't do.
const USER = 'e2e-calendar@test.local';

test.beforeEach(async ({ context, weekPage }) => {
  await loginAsDevUser(context, USER);
  await weekPage.goto();
});

test('mode switch is present and defaults to meals', async ({ weekPage }) => {
  await expect(weekPage.modeSwitch).toBeVisible();
  await expect(weekPage.mealsToggle).toHaveAttribute('aria-selected', 'true');
  await expect(weekPage.calendarToggle).toHaveAttribute('aria-selected', 'false');
  // Meals mode shows the seven day blocks.
  await expect(weekPage.dayBlocks).toHaveCount(7);
});

test('switching to calendar replaces meals with the connect prompt, and back', async ({
  weekPage,
}) => {
  await weekPage.showCalendar();

  // Unauthorised → connect prompt fills the day-list area; the meal day blocks
  // are gone (events replace meals, they don't sit alongside).
  await expect(weekPage.calendarConnect).toBeVisible();
  await expect(
    weekPage.calendarConnect.getByRole('button', { name: /connect google calendar/i }),
  ).toBeVisible();
  await expect(weekPage.dayBlocks).toHaveCount(0);
  await expect(weekPage.calendarToggle).toHaveAttribute('aria-selected', 'true');

  // Toggling back restores the meal day blocks.
  await weekPage.showMeals();
  await expect(weekPage.dayBlocks).toHaveCount(7);
  await expect(weekPage.calendarConnect).toHaveCount(0);
});
