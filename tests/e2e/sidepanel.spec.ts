import { chromium, expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const EXTENSION_PATH = resolve('.output/chrome-mv3');

let context: BrowserContext;
let userDataDir: string;
let id: string;

test.beforeAll(async () => {
  userDataDir = mkdtempSync(join(tmpdir(), 'sidekick-e2e-panel-'));
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  id = new URL(worker.url()).host;
});

test.afterAll(async () => {
  await context.close();
  rmSync(userDataDir, { recursive: true, force: true });
});

async function openOptions(): Promise<Page> {
  const page = await context.newPage();
  await page.addInitScript(() => {
    chrome.permissions.request = () => Promise.resolve(true);
  });
  await page.goto(`chrome-extension://${id}/options.html`);
  return page;
}

test('side panel switches navigation modes from the options setting and keeps notes', async () => {
  const options = await openOptions();
  await options.getByLabel('Address').fill('example.com');
  await options.getByLabel('Address').press('Tab');
  await options.getByRole('button', { name: 'Add site' }).click();
  await expect(
    options.getByRole('list', { name: 'Sites' }).getByText('https://example.com/'),
  ).toBeVisible();

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${id}/sidepanel.html`);
  await expect(panel.getByLabel('Site', { exact: true })).toBeVisible();
  await expect(panel.getByRole('tablist')).toHaveCount(0);

  await options.getByRole('radio', { name: /Top bar/ }).click();
  await expect(panel.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(panel.getByLabel('Site', { exact: true })).toHaveCount(0);

  await options.getByRole('radio', { name: /Icon sidebar/ }).click();
  await expect(panel.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');

  await options.getByRole('radio', { name: /Dropdown/ }).click();
  await expect(panel.getByLabel('Site', { exact: true })).toBeVisible();
  await expect(panel.getByRole('tablist')).toHaveCount(0);

  await options.getByRole('radio', { name: /Top bar/ }).click();
  await panel.getByRole('tab', { name: 'Notes' }).click();
  const notes = panel.locator('wa-textarea textarea');
  await notes.fill('# persisted note');
  await expect(panel.getByRole('status')).toHaveText('Saved');

  await panel.reload();
  await panel.getByRole('tab', { name: 'Notes' }).click();
  await expect(panel.locator('wa-textarea textarea')).toHaveValue('# persisted note');
});

test('cog opens settings inside the panel and back returns to the sites', async () => {
  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${id}/sidepanel.html`);
  await panel.getByRole('button', { name: 'Settings' }).click();
  await expect(panel.getByRole('heading', { name: 'SideKick 🦾', level: 1 })).toBeVisible();
  await panel.getByRole('button', { name: /Back to sites/ }).click();
  await expect(panel.getByRole('heading', { name: 'SideKick 🦾', level: 1 })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Settings' })).toBeVisible();
});
