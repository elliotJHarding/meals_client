// Smoke check for the CDP lab harness: drives the lab Chrome tab through the
// WeekPage model. Run with: npx tsx e2e/lab/smoke.ts
import { expect } from '@playwright/test';
import { connectLab } from './connect';

const session = await connectLab('lab@test.local');
const { weekPage, gotoApp } = session;

await gotoApp();
await weekPage.waitLoaded();
console.log('subtitle:', await weekPage.subtitle.textContent());
console.log('day blocks:', await weekPage.dayBlocks.count());

await weekPage.addEntry(weekPage.today, 'CDP smoke entry');
console.log('entry added via page model, visible in lab Chrome');

await weekPage.removeEntry(weekPage.today, 0);
await expect(weekPage.entries(weekPage.today)).toHaveCount(0);
console.log('entry removed, day clean');

process.exit(0);
