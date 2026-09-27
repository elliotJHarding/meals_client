import { Locator, Page, expect } from '@playwright/test';

/** The meal library: read-mostly cards built by ingestion. */
export class LibraryPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/library');
  }

  mealCard(name: string): Locator {
    return this.page.locator('.meal-card', { hasText: name });
  }

  mealName(name: string): Locator {
    return this.page.locator('.meal-card h3', { hasText: name });
  }

  async expand(name: string): Promise<void> {
    await this.mealCard(name).click();
  }

  async expectHasIngredients(name: string): Promise<void> {
    await this.expand(name);
    await expect(
      this.page.locator('.meal-card.expanded .ingredients li').first(),
    ).toBeVisible();
  }
}
