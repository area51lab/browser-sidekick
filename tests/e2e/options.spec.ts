import { chromium, expect, test } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const EXTENSION_PATH = resolve('.output/chrome-mv3');

let context: BrowserContext;
let userDataDir: string;

test.beforeAll(async () => {
  userDataDir = mkdtempSync(join(tmpdir(), 'sidekick-e2e-'));
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
  });
});

test.afterAll(async () => {
  await context.close();
  rmSync(userDataDir, { recursive: true, force: true });
});

async function extensionId(): Promise<string> {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  return new URL(worker.url()).host;
}

test('adds a site on the options page and lists it', async () => {
  const id = await extensionId();
  const page = await context.newPage();
  await page.addInitScript(() => {
    chrome.permissions.request = () => Promise.resolve(true);
  });
  await page.goto(`chrome-extension://${id}/options.html`);

  await page.getByLabel('Address').fill('example.com');
  await page.getByLabel('Address').press('Tab');
  await expect(page.getByLabel('Name')).not.toHaveAttribute('placeholder', 'Taken from the site');
  await page.getByRole('button', { name: 'Add site' }).click();

  const list = page.getByRole('list', { name: 'Sites' });
  await expect(list.getByText('https://example.com/')).toBeVisible();
});
