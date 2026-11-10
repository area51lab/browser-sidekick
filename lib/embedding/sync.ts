import { browser } from 'wxt/browser';
import { buildEmbeddingRules, type EmbeddableSite } from './rules';

export const SITES_STORAGE_KEY = 'sites';

let queue: Promise<void> = Promise.resolve();

function extensionHost(): string {
  return new URL(browser.runtime.getURL('/')).host;
}

async function replaceRules(sites: readonly EmbeddableSite[]): Promise<void> {
  const { declarativeNetRequest: dnr } = browser;
  const existing = await dnr.getDynamicRules();
  await dnr.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: buildEmbeddingRules(sites, extensionHost()),
  });
}

export function syncEmbeddingRules(sites: readonly EmbeddableSite[]): Promise<void> {
  queue = queue.then(
    () => replaceRules(sites),
    () => replaceRules(sites),
  );
  return queue;
}

function parseStoredSites(raw: unknown): EmbeddableSite[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is EmbeddableSite =>
      typeof item === 'object' && item !== null && typeof item.url === 'string',
  );
}

/**
 * Only coupling with the storage layer: the raw `sites` key of
 * `storage.local`, expected to hold an array of objects with a string `url`.
 */
export async function startEmbeddingSync(): Promise<void> {
  const stored = await browser.storage.local.get(SITES_STORAGE_KEY);
  await syncEmbeddingRules(parseStoredSites(stored[SITES_STORAGE_KEY]));
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(SITES_STORAGE_KEY in changes)) return;
    void syncEmbeddingRules(parseStoredSites(changes[SITES_STORAGE_KEY].newValue));
  });
}
