import { test as base } from '@playwright/test';
import { WeekPage } from './pages/WeekPage';
import { ShopPage } from './pages/ShopPage';
import { LibraryPage } from './pages/LibraryPage';

type Pages = {
  weekPage: WeekPage;
  shopPage: ShopPage;
  libraryPage: LibraryPage;
};

export const test = base.extend<Pages>({
  weekPage: async ({ page }, use) => use(new WeekPage(page)),
  shopPage: async ({ page }, use) => use(new ShopPage(page)),
  libraryPage: async ({ page }, use) => use(new LibraryPage(page)),
});

export { expect } from '@playwright/test';
