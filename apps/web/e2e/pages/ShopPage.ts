import { Locator, Page, expect } from '@playwright/test';

/** The receipt upload screen and ingestion outcome. */
export class ShopPage {
  readonly workingCard: Locator;
  readonly result: Locator;
  readonly resultSummary: Locator;
  readonly linkedMealNames: Locator;
  readonly unlinkedSummary: Locator;
  readonly receiptRows: Locator;

  constructor(private readonly page: Page) {
    this.workingCard = page.locator('.upload-card.working');
    this.result = page.locator('.ingestion-result');
    this.resultSummary = page.locator('.ingestion-result h2');
    this.linkedMealNames = page.locator('.linked-meal .name');
    this.unlinkedSummary = page.locator('.unlinked-summary');
    this.receiptRows = page.locator('.receipt-row');
  }

  async goto(): Promise<void> {
    await this.page.goto('/shop');
  }

  async uploadEml(path: string): Promise<void> {
    await this.page.locator('input[type=file]').setInputFiles(path);
    await expect(this.workingCard).toBeVisible();
  }

  /** Ingestion makes two LLM calls; allow minutes, not seconds. */
  async waitForResult(timeoutMs = 240_000): Promise<void> {
    await expect(this.result).toBeVisible({ timeout: timeoutMs });
  }

  linkedMeal(name: string): Locator {
    return this.linkedMealNames.filter({ hasText: name });
  }
}
