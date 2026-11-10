import { beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (changes: Record<string, { newValue?: unknown }>, area: string) => void;

const state = vi.hoisted(() => ({
  rules: [] as { id: number }[],
  stored: {} as Record<string, unknown>,
  listeners: [] as Listener[],
  granted: false,
  requestResult: true,
  failNextUpdate: false,
}));

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: { getURL: (path: string) => `chrome-extension://extid${path}` },
    declarativeNetRequest: {
      getDynamicRules: vi.fn(async () => state.rules),
      updateDynamicRules: vi.fn(
        async ({
          removeRuleIds,
          addRules,
        }: {
          removeRuleIds: number[];
          addRules: { id: number }[];
        }) => {
          if (state.failNextUpdate) {
            state.failNextUpdate = false;
            throw new Error('boom');
          }
          state.rules = state.rules.filter((r) => !removeRuleIds.includes(r.id)).concat(addRules);
        },
      ),
    },
    storage: {
      local: { get: vi.fn(async (key: string) => ({ [key]: state.stored[key] })) },
      onChanged: { addListener: (l: Listener) => state.listeners.push(l) },
    },
    permissions: {
      contains: vi.fn(async () => state.granted),
      request: vi.fn(async () => state.requestResult),
    },
  },
}));

import { browser } from 'wxt/browser';
import { ensureSitePermission, hasSitePermission } from '../../lib/embedding/permissions';
import { startEmbeddingSync, syncEmbeddingRules } from '../../lib/embedding/sync';

const hosts = () => state.rules.length;

beforeEach(() => {
  state.rules = [];
  state.stored = {};
  state.listeners = [];
  state.granted = false;
  state.requestResult = true;
  state.failNextUpdate = false;
  vi.clearAllMocks();
});

describe('syncEmbeddingRules', () => {
  it('replaces all existing dynamic rules with the new set', async () => {
    state.rules = [{ id: 99 }];
    await syncEmbeddingRules([{ url: 'https://a.com' }, { url: 'https://b.com' }]);
    expect(state.rules.some((r) => r.id === 99)).toBe(false);
    expect(hosts()).toBe(2);
    await syncEmbeddingRules([{ url: 'https://a.com' }]);
    expect(hosts()).toBe(1);
    await syncEmbeddingRules([]);
    expect(hosts()).toBe(0);
  });

  it('scopes rules to the extension host', async () => {
    await syncEmbeddingRules([{ url: 'https://a.com' }]);
    const call = vi.mocked(browser.declarativeNetRequest.updateDynamicRules).mock.calls[0]![0];
    expect(call.addRules?.[0]!.condition.initiatorDomains).toEqual(['extid']);
  });

  it('serializes overlapping syncs and recovers after a failure', async () => {
    state.failNextUpdate = true;
    const first = syncEmbeddingRules([{ url: 'https://a.com' }]);
    const second = syncEmbeddingRules([{ url: 'https://b.com' }]);
    await expect(first).rejects.toThrow('boom');
    await second;
    expect(hosts()).toBe(1);
  });
});

describe('startEmbeddingSync', () => {
  it('syncs the stored sites on start', async () => {
    state.stored.sites = [{ url: 'https://a.com' }, { url: 'https://b.com' }];
    await startEmbeddingSync();
    expect(hosts()).toBe(2);
  });

  it('treats missing or malformed storage as an empty list', async () => {
    state.stored.sites = [null, 1, { name: 'x' }, { url: 'https://a.com' }];
    await startEmbeddingSync();
    expect(hosts()).toBe(1);
    state.stored.sites = 'nope';
    await startEmbeddingSync();
    expect(hosts()).toBe(0);
  });

  it('resyncs when the sites key changes in local storage', async () => {
    await startEmbeddingSync();
    const listener = state.listeners[0]!;
    listener({ sites: { newValue: [{ url: 'https://a.com' }] } }, 'local');
    await vi.waitFor(() => expect(hosts()).toBe(1));
    listener({ sites: { newValue: undefined } }, 'local');
    await vi.waitFor(() => expect(hosts()).toBe(0));
  });

  it('ignores other keys and other storage areas', async () => {
    await startEmbeddingSync();
    const calls = vi.mocked(browser.declarativeNetRequest.updateDynamicRules).mock.calls.length;
    const listener = state.listeners[0]!;
    listener({ other: { newValue: [] } }, 'local');
    listener({ sites: { newValue: [] } }, 'sync');
    expect(vi.mocked(browser.declarativeNetRequest.updateDynamicRules).mock.calls.length).toBe(
      calls,
    );
  });
});

describe('ensureSitePermission', () => {
  it('rejects unsupported urls without prompting', async () => {
    expect(await ensureSitePermission('nope')).toBe(false);
    expect(browser.permissions.request).not.toHaveBeenCalled();
  });

  it('skips the prompt when already granted', async () => {
    state.granted = true;
    expect(await ensureSitePermission('https://a.com/x')).toBe(true);
    expect(browser.permissions.request).not.toHaveBeenCalled();
  });

  it('requests the site origin otherwise', async () => {
    expect(await ensureSitePermission('https://a.com:81/x')).toBe(true);
    expect(browser.permissions.request).toHaveBeenCalledWith({
      origins: ['*://*.a.com/*', '*://a.com/*'],
    });
    state.requestResult = false;
    expect(await ensureSitePermission('https://a.com/x')).toBe(false);
  });
});

describe('hasSitePermission', () => {
  it('is false for unsupported urls without asking the browser', async () => {
    expect(await hasSitePermission('nope')).toBe(false);
    expect(browser.permissions.contains).not.toHaveBeenCalled();
  });

  it('checks the parent domain patterns', async () => {
    state.granted = true;
    expect(await hasSitePermission('https://mail.a.com/')).toBe(true);
    expect(browser.permissions.contains).toHaveBeenCalledWith({
      origins: ['*://*.a.com/*', '*://a.com/*'],
    });
    state.granted = false;
    expect(await hasSitePermission('https://mail.a.com/')).toBe(false);
  });
});
