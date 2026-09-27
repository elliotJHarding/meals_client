import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { test, expect } from './fixtures';
import { loginAsDevUser } from './helpers';

/**
 * The meals 2.0 vision, end to end: free-text meals typed into the week,
 * the real Tesco order email uploaded, and the meal library built by LLM
 * ingestion with no further effort.
 *
 * Needs the real receipt .eml in ~/Downloads (not committed - contains
 * personal data) and the AI service running with a GOOGLE_API_KEY.
 * Makes two real LLM calls, so this is slow (~1-2 min).
 */

const USER = 'e2e-shop@test.local';
const RECEIPT_EML = process.env.RECEIPT_EML
  ?? path.join(os.homedir(), 'Downloads', 'Receipt for your tesco.com order 6421-8259-162 today.eml');

const RECEIPT_WEEK_SUBTITLE = '1 – 7 June 2026';

// The real plan for the receipt's week (collected Monday 1 June 2026)
const WEEK_MEALS: Record<number, string> = {
  1: 'Caesar Salad',
  2: 'Spaghetti Bolognese',
  3: 'Sausage and sweet potato mash',
  4: 'Chicken pesto pasta',
  5: 'Mie Goreng',
};

test('receipt upload links the week and populates the library', async ({
  context, weekPage, shopPage, libraryPage,
}) => {
  test.skip(!fs.existsSync(RECEIPT_EML), `receipt email not found at ${RECEIPT_EML}`);
  test.setTimeout(300_000);

  await loginAsDevUser(context, USER);

  // Plan the receipt's week in free text (idempotent across runs)
  await weekPage.gotoWeekWithSubtitle(RECEIPT_WEEK_SUBTITLE);
  for (const [dayNumber, meal] of Object.entries(WEEK_MEALS)) {
    await weekPage.addEntryIfMissing(weekPage.day(Number(dayNumber)), meal);
  }

  // Upload the real order email
  await shopPage.goto();
  await shopPage.uploadEml(RECEIPT_EML);
  await shopPage.waitForResult();

  // All five meals linked, receipt summarised, leftovers categorised
  await expect(shopPage.resultSummary).toContainText('items');
  for (const meal of Object.values(WEEK_MEALS)) {
    await expect(shopPage.linkedMeal(meal)).toBeVisible();
  }
  await expect(shopPage.unlinkedSummary).toBeVisible();

  // The library has built itself from the week + receipt
  await libraryPage.goto();
  for (const meal of Object.values(WEEK_MEALS)) {
    await expect(libraryPage.mealName(meal)).toBeVisible();
  }
  await libraryPage.expectHasIngredients('Spaghetti Bolognese');

  // Week entries are now linked to library meals (sage dot)
  await weekPage.gotoWeekWithSubtitle(RECEIPT_WEEK_SUBTITLE);
  await expect(weekPage.linkedDots).toHaveCount(5);

  // The shop page lists the receipt in history
  await shopPage.goto();
  await expect(shopPage.receiptRows.first()).toContainText('2026-06-01');
});
