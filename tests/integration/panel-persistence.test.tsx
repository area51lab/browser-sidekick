import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

type Details = { tabId: number; frameId: number; parentFrameId: number; url: string };
type NavListener = (details: Details) => Promise<void>;
type ActivatedListener = (info: { tabId: number; windowId: number }) => void;

const navListeners = new Set<NavListener>();
const activatedListeners = new Set<ActivatedListener>();

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
      query: vi.fn(async () => [{ id: 1, windowId: 1 }]),
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

describe('panel persistence', () => {
  let cleanup = () => {};

  beforeEach(() => {
    navListeners.clear();
    activatedListeners.clear();
  });
  afterEach(() => cleanup());

  it('keeps the active item and frames when the browser tab changes', async () => {
    const { host, unmount } = await setup('last-url');
    cleanup = unmount;
    await navigate(7, 'https://a.test/deep/page');
    await act(async () => tabs(host)[1]!.click());
    await flush();
    const before = [...host.querySelectorAll('.frame')];
    expect(frameSrcs(host)).toEqual(['https://a.test/', 'https://b.test/']);

    await switchBrowserTab(2);
    await switchBrowserTab(1);

    expect(tabs(host)[1]!.getAttribute('aria-selected')).toBe('true');
    expect([...host.querySelectorAll('.frame')]).toEqual(before);
    expect(activatedListeners.size).toBe(0);
  });

  it('records the visited url of each site in the shared panel state', async () => {
    const { host, store, unmount } = await setup('last-url');
    cleanup = unmount;
    await navigate(7, 'https://a.test/deep/page');
    await act(async () => tabs(host)[1]!.click());
    await flush();
    await navigate(8, 'https://b.test/inbox');
    expect((await store.panelState.get()).urlBySiteId).toEqual({
      a: 'https://a.test/deep/page',
      b: 'https://b.test/inbox',
    });
  });

  it('restores the last urls when the panel is reopened with last-url', async () => {
    const first = await setup('last-url');
    await navigate(7, 'https://a.test/deep/page');
    first.unmount();
    act(() => render(<App store={first.store} />, first.host));
    await flush();
    cleanup = () => act(() => render(null, first.host));
    expect(frameSrcs(first.host)).toEqual(['https://a.test/deep/page']);
  });

  it('always loads the configured url with configured-url while keeping the active item', async () => {
    const { host, store, unmount } = await setup('configured-url');
    await navigate(7, 'https://a.test/deep/page');
    await act(async () => tabs(host)[1]!.click());
    await flush();
    unmount();
    act(() => render(<App store={store} />, host));
    await flush();
    cleanup = () => act(() => render(null, host));

    expect(tabs(host)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(frameSrcs(host)).toEqual(['https://b.test/']);
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
