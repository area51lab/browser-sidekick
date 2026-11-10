import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

type Details = { tabId: number; frameId: number; parentFrameId: number; url: string };
type NavListener = (details: Details) => Promise<void>;
type ActivatedListener = (info: { tabId: number; windowId: number }) => void;

const navListeners = new Set<NavListener>();
const activatedListeners = new Set<ActivatedListener>();
const query = vi.fn();

vi.mock('@awesome.me/webawesome/dist/components/textarea/textarea.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/select/select.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/option/option.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/spinner/spinner.js', () => ({}));
vi.mock('../../components/SiteFrame', () => ({
  SiteFrame: ({ url }: { url: string }) => <div class="frame" data-src={url} />,
}));
vi.mock('wxt/browser', () => ({
  browser: {
    runtime: { openOptionsPage: vi.fn(), getURL: () => 'chrome-extension://x/' },
    storage: {},
    tabs: {
      query,
      create: vi.fn(),
      onActivated: {
        addListener: (l: ActivatedListener) => activatedListeners.add(l),
        removeListener: (l: ActivatedListener) => activatedListeners.delete(l),
      },
    },
    webNavigation: {
      getFrame: async () => ({ url: 'chrome-extension://x/sidepanel.html' }),
      onCommitted: {
        addListener: (l: NavListener) => navListeners.add(l),
        removeListener: (l: NavListener) => navListeners.delete(l),
      },
      onHistoryStateUpdated: { addListener: () => {}, removeListener: () => {} },
    },
  },
}));

const { App } = await import('../../entrypoints/sidepanel/App');
const { createStore } = await import('../../lib/storage/store');
const { DEFAULT_SETTINGS } = await import('../../lib/storage/types');
const { createFakeAdapter } = await import('../helpers/fakeStorage');
import type { Persistence, Site } from '../../lib/storage';

const sites: Site[] = [
  { id: 'a', url: 'https://a.test/', title: 'Alpha', createdAt: 1 },
  { id: 'b', url: 'https://b.test/', title: 'Beta', createdAt: 2 },
];

const flush = async () => {
  for (let i = 0; i < 4; i++)
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
};
const frameSrcs = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('.frame')).map((f) => f.getAttribute('data-src'));
const tabs = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLElement>('[role="tab"]'));

const navigate = (frameId: number, url: string) =>
  act(async () => {
    await Promise.all(
      [...navListeners].map((l) => l({ tabId: 1, frameId, parentFrameId: 0, url })),
    );
  });

const switchBrowserTab = async (tabId: number) => {
  await act(async () => {
    activatedListeners.forEach((l) => l({ tabId, windowId: 1 }));
  });
  await flush();
};

async function setup(persistence: Persistence) {
  const store = createStore({
    local: createFakeAdapter({
      schemaVersion: 1,
      sites,
      settings: { ...DEFAULT_SETTINGS, navigationMode: 'top-bar', persistence },
    }),
    session: createFakeAdapter(),
  });
  const host = document.createElement('div');
  document.body.append(host);
  act(() => render(<App store={store} />, host));
  await flush();
  return { host, store, unmount: () => act(() => render(null, host)) };
}

describe('per-tab persistence', () => {
  let cleanup = () => {};

  beforeEach(() => {
    navListeners.clear();
    activatedListeners.clear();
    query.mockReset();
    query.mockResolvedValue([{ id: 1, windowId: 1 }]);
  });
  afterEach(() => cleanup());

  it('restores the active item and visited url of each tab with last-url', async () => {
    const { host, store, unmount } = await setup('last-url');
    cleanup = unmount;
    expect(frameSrcs(host)).toEqual(['https://a.test/']);

    await navigate(7, 'https://a.test/deep/page');
    await act(async () => tabs(host)[1]!.click());
    await flush();
    await navigate(8, 'https://b.test/inbox');
    expect((await store.tabState(1).get()).urlBySiteId).toEqual({
      a: 'https://a.test/deep/page',
      b: 'https://b.test/inbox',
    });

    await switchBrowserTab(2);
    expect(frameSrcs(host)).toEqual(['https://a.test/']);
    expect(tabs(host)[0]!.getAttribute('aria-selected')).toBe('true');

    await switchBrowserTab(1);
    expect(tabs(host)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(frameSrcs(host)).toEqual(['https://b.test/inbox']);
    await act(async () => tabs(host)[0]!.click());
    await flush();
    expect(frameSrcs(host)).toEqual(['https://a.test/deep/page', 'https://b.test/inbox']);
  });

  it('keeps iframes of the viewed tab only', async () => {
    const { host, unmount } = await setup('last-url');
    cleanup = unmount;
    await act(async () => tabs(host)[1]!.click());
    await flush();
    expect(host.querySelectorAll('.frame')).toHaveLength(2);
    await switchBrowserTab(2);
    expect(host.querySelectorAll('.frame')).toHaveLength(1);
  });

  it('always loads the configured url with configured-url while still restoring the active item', async () => {
    const { host, unmount } = await setup('configured-url');
    cleanup = unmount;
    await navigate(7, 'https://a.test/deep/page');
    await act(async () => tabs(host)[1]!.click());
    await flush();

    await switchBrowserTab(2);
    await switchBrowserTab(1);
    expect(tabs(host)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(frameSrcs(host)).toEqual(['https://b.test/']);
    await act(async () => tabs(host)[0]!.click());
    await flush();
    expect(frameSrcs(host)).toEqual(['https://a.test/', 'https://b.test/']);
  });

  it('does not reload a mounted iframe when its tracked url changes', async () => {
    const { host, unmount } = await setup('last-url');
    cleanup = unmount;
    const frame = host.querySelector('.frame');
    await navigate(7, 'https://a.test/next');
    expect(host.querySelector('.frame')).toBe(frame);
    expect(frame!.getAttribute('data-src')).toBe('https://a.test/');
  });
});
