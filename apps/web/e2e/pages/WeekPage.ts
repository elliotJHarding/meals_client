import { Locator, Page, expect } from '@playwright/test';

/**
 * The week planner (home). A day is addressed by its day-of-month number as
 * displayed in the journal margin.
 */
export class WeekPage {
  readonly subtitle: Locator;
  readonly dayBlocks: Locator;
  readonly today: Locator;
  readonly linkedDots: Locator;

  constructor(private readonly page: Page) {
    this.subtitle = page.locator('.week-subtitle');
    this.dayBlocks = page.locator('.day-block');
    this.today = page.locator('.day-block.today');
    this.linkedDots = page.locator('.entry-row .linked-dot');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitLoaded();
  }

  /** Day blocks only render once the week's data has loaded. */
  async waitLoaded(): Promise<void> {
    await expect(this.dayBlocks).toHaveCount(7);
  }

  day(dayOfMonth: number): Locator {
    return this.dayBlocks.filter({
      has: this.page.locator('.num', { hasText: new RegExp(`^${dayOfMonth}$`) }),
    });
  }

  entries(day: Locator): Locator {
    return day.locator('.entry-row .text');
  }

  async addEntry(day: Locator, text: string): Promise<void> {
    await day.getByRole('button', { name: /add/ }).click();
    const input = day.getByPlaceholder("what's cooking?");
    await input.fill(text);
    await input.press('Enter');
    await expect(this.entries(day).filter({ hasText: text })).toBeVisible();
  }

  async addEntryIfMissing(day: Locator, text: string): Promise<void> {
    const existing = await this.entries(day).allTextContents();
    if (!existing.includes(text)) {
      await this.addEntry(day, text);
    }
  }

  async removeEntry(day: Locator, index = 0): Promise<void> {
    await day.locator('.entry-row .remove').nth(index).click();
  }

  async gotoPreviousWeek(): Promise<void> {
    await this.page.getByRole('button', { name: 'Previous week' }).click();
  }

  async gotoToday(): Promise<void> {
    await this.page.getByRole('button', { name: 'today' }).click();
  }

  /** Navigate back until the subtitle shows the given range, data loaded. */
  async gotoWeekWithSubtitle(range: string | RegExp, maxWeeksBack = 10): Promise<void> {
    await this.goto();
    const pattern = typeof range === 'string' ? new RegExp(range) : range;
    for (let i = 0; i < maxWeeksBack; i++) {
      if (pattern.test((await this.subtitle.textContent()) ?? '')) {
        break;
      }
      await this.gotoPreviousWeek();
    }
    await expect(this.subtitle).toHaveText(pattern);
    await this.waitLoaded();
  }
}
