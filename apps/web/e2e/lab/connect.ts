import { BrowserContext, Page, chromium } from '@playwright/test';
import { WeekPage } from '../pages/WeekPage';
import { ShopPage } from '../pages/ShopPage';
import { LibraryPage } from '../pages/LibraryPage';
import { loginAsDevUser } from '../helpers';

export const APP_URL = 'http://localhost:5173';
const CDP_URL = 'http://localhost:9222';

export type LabSession = {
  context: BrowserContext;
  page: Page;
  weekPage: WeekPage;
  shopPage: ShopPage;
  libraryPage: LibraryPage;
  /**
   * The adopted CDP context has no baseURL, so the page models' relative
   * goto('/') cannot be used — navigate with this instead, then drive via
   * the models' locator-based methods.
   */
  gotoApp: () => Promise<void>;
};

/**
 * Attach to the lab Chrome (started by .localdev/run-lab-chrome.sh) and wrap
 * its app tab in the e2e page models. Reattaching adopts the same tab, so
 * browser state persists across driver runs — drive a step, inspect the tab
 * with the Chrome MCP tools, then run the next step.
 */
export async function connectLab(devUserEmail?: string): Promise<LabSession> {
  const browser = await chromium.connectOverCDP(CDP_URL);
  const context = browser.contexts()[0];
  if (!context) {
    throw new Error('No browser context found — is the lab Chrome running?');
  }

  const page =
    context.pages().find((p) => p.url().startsWith(APP_URL)) ?? (await context.newPage());

  if (devUserEmail) {
    await loginAsDevUser(context, devUserEmail);
  }

  return {
    context,
    page,
    weekPage: new WeekPage(page),
    shopPage: new ShopPage(page),
    libraryPage: new LibraryPage(page),
    gotoApp: async () => {
      await page.goto(APP_URL);
    },
  };
}
