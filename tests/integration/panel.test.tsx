import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

const openOptionsPage = vi.fn();
vi.mock('@awesome.me/webawesome/dist/components/select/select.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/option/option.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('../../components/SiteView', () => ({
  SiteView: ({ url }: { url: string }) => <div class="site-view" data-url={url} />,
}));
vi.mock('wxt/browser', () => ({
  browser: { runtime: { openOptionsPage }, storage: {}, tabs: {} },
}));

const { Panel } = await import('../../entrypoints/sidepanel/Panel');
const { createStore } = await import('../../lib/storage/store');
const { DEFAULT_SETTINGS } = await import('../../lib/storage/types');
const { createFakeAdapter } = await import('../helpers/fakeStorage');
import type { NavigationMode, Settings, Site } from '../../lib/storage';

const sites: Site[] = [
  { id: 'a', url: 'https://a.test/', title: 'Alpha', createdAt: 1 },
  {
    id: 'b',
    url: 'https://b.test/',
    title: 'Beta',
    faviconUrl: 'https://b.test/f.png',
    createdAt: 2,
  },
];

const settle = async (action: () => void) => {
  await act(async () => {
    action();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
};

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

async function setup(settings: Partial<Settings>, initialSites: Site[] = sites, activeItemId = '') {
  const store = createStore({
    local: createFakeAdapter({
      schemaVersion: 1,
      sites: initialSites,
      settings: { ...DEFAULT_SETTINGS, ...settings },
    }),
    session: createFakeAdapter(),
  });
  if (activeItemId) await store.tabState(1).set({ tabId: 1, activeItemId, urlBySiteId: {} });
  const host = document.createElement('div');
  document.body.append(host);
  act(() => render(<Panel tabId={1} store={store} />, host));
  await flush();
  return { host, store, unmount: () => act(() => render(null, host)) };
}

const frames = (host: HTMLElement) => Array.from(host.querySelectorAll('.site-view'));
const hiddenOf = (el: Element) => el.closest('.panel-item')!.hasAttribute('hidden');
const tabs = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLElement>('[role="tab"]'));

describe('Panel', () => {
  let cleanup: () => void = () => {};
  beforeEach(() => openOptionsPage.mockReset());
  afterEach(() => cleanup());

  it('renders nothing until storage is ready', () => {
    const host = document.createElement('div');
    const store = createStore({ local: createFakeAdapter(), session: createFakeAdapter() });
    act(() => render(<Panel tabId={1} store={store} />, host));
    expect(host.innerHTML).toBe('');
  });

  it('shows an empty state that opens the options page', async () => {
    const { host, unmount } = await setup({}, []);
    cleanup = unmount;
    expect(host.textContent).toContain('No sites yet');
    host.querySelector('wa-button')!.dispatchEvent(new Event('click'));
    expect(openOptionsPage).toHaveBeenCalled();
  });

  it('can still open notes when there are no sites', async () => {
    const { host, unmount } = await setup({ navigationMode: 'top-bar' }, []);
    cleanup = unmount;
    await settle(() => tabs(host)[0]!.click());
    expect(host.textContent).not.toContain('No sites yet');
    expect(host.querySelector('.notes-tab')).not.toBeNull();
  });

  it.each<NavigationMode>(['dropdown', 'icon-sidebar', 'top-bar'])(
    'renders only the %s navigation',
    async (mode) => {
      const { host, unmount } = await setup({ navigationMode: mode });
      cleanup = unmount;
      expect(host.querySelectorAll('nav')).toHaveLength(1);
      expect(host.querySelector('nav')!.className).toContain(
        `nav-${mode === 'dropdown' ? 'dropdown' : mode}`,
      );
      expect(frames(host)).toHaveLength(1);
      expect(frames(host)[0]!.getAttribute('data-url')).toBe('https://a.test/');
    },
  );

  it('dropdown lists all items and switches on change', async () => {
    const { host, store, unmount } = await setup({ navigationMode: 'dropdown' });
    cleanup = unmount;
    const options = Array.from(host.querySelectorAll('wa-option'));
    expect(options.map((o) => o.getAttribute('value'))).toEqual(['a', 'b', 'notes']);
    const select = host.querySelector('wa-select') as HTMLElement & { value: string };
    select.value = 'b';
    await settle(() => select.dispatchEvent(new Event('change')));
    expect((await store.tabState(1).get()).activeItemId).toBe('b');
    expect(frames(host)).toHaveLength(2);
  });

  it('icon sidebar switches on click, highlights active and pins notes last', async () => {
    const { host, unmount } = await setup({ navigationMode: 'icon-sidebar' });
    cleanup = unmount;
    const all = tabs(host);
    expect(all.map((t) => t.getAttribute('aria-label'))).toEqual(['Alpha', 'Beta', 'Notes']);
    expect(all[2]!.className).toContain('nav-tab-notes');
    expect(all[0]!.getAttribute('aria-selected')).toBe('true');
    expect(host.querySelectorAll('wa-tooltip')).toHaveLength(3);
    expect(host.querySelector('img')!.getAttribute('src')).toBe('https://b.test/f.png');

    await settle(() => all[1]!.click());
    expect(tabs(host)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs(host)[0]!.getAttribute('aria-selected')).toBe('false');
  });

  it('top bar shows names or icons depending on settings', async () => {
    const names = await setup({ navigationMode: 'top-bar', topBarDisplay: 'names' });
    expect(names.host.querySelector('.nav-label')!.textContent).toBe('Alpha');
    expect(names.host.querySelectorAll('wa-tooltip')).toHaveLength(0);
    names.unmount();
    const icons = await setup({ navigationMode: 'top-bar', topBarDisplay: 'icons' });
    cleanup = icons.unmount;
    expect(icons.host.querySelector('.nav-label')).toBeNull();
    expect(icons.host.querySelectorAll('wa-tooltip')).toHaveLength(3);
  });

  it('supports arrow, Home and End keys with roving tabindex', async () => {
    const { host, unmount } = await setup({ navigationMode: 'top-bar', topBarDisplay: 'names' });
    cleanup = unmount;
    const list = host.querySelector('[role="tablist"]')!;
    const press = (key: string) =>
      settle(() => {
        (document.activeElement && host.contains(document.activeElement)
          ? document.activeElement
          : tabs(host)[0]!
        ).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      });
    expect(list.getAttribute('aria-orientation')).toBe('horizontal');
    expect(tabs(host).map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    tabs(host)[0]!.focus();
    await press('ArrowRight');
    expect(tabs(host)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs(host).map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    await press('End');
    expect(tabs(host)[2]!.getAttribute('aria-selected')).toBe('true');
    await press('ArrowRight');
    expect(tabs(host)[0]!.getAttribute('aria-selected')).toBe('true');
    await press('x');
    expect(tabs(host)[0]!.getAttribute('aria-selected')).toBe('true');
  });

  it('ignores key presses that do not originate from a tab', async () => {
    const { host, unmount } = await setup({ navigationMode: 'top-bar' });
    cleanup = unmount;
    await act(() => {
      host
        .querySelector('[role="tablist"]')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(tabs(host)[0]!.getAttribute('aria-selected')).toBe('true');
  });

  it('mounts sites lazily and keeps visited iframes mounted but hidden', async () => {
    const { host, unmount } = await setup({ navigationMode: 'top-bar' });
    cleanup = unmount;
    expect(frames(host)).toHaveLength(1);
    const first = frames(host)[0]!;

    await settle(() => tabs(host)[1]!.click());
    expect(frames(host)).toHaveLength(2);
    expect(hiddenOf(frames(host)[0]!)).toBe(true);
    expect(hiddenOf(frames(host)[1]!)).toBe(false);

    await settle(() => tabs(host)[0]!.click());
    expect(frames(host)[0]).toBe(first);
    expect(hiddenOf(first)).toBe(false);
    expect(hiddenOf(frames(host)[1]!)).toBe(true);
  });

  it('mounts notes lazily and hides it when switching away', async () => {
    const { host, unmount } = await setup({ navigationMode: 'icon-sidebar' });
    cleanup = unmount;
    expect(host.querySelector('.notes-tab')).toBeNull();
    await settle(() => tabs(host)[2]!.click());
    expect(hiddenOf(host.querySelector('.notes-tab')!)).toBe(false);
    expect(hiddenOf(frames(host)[0]!)).toBe(true);
    await settle(() => tabs(host)[0]!.click());
    expect(hiddenOf(host.querySelector('.notes-tab')!)).toBe(true);
  });

  it('restores the stored active item and unmounts removed sites', async () => {
    const { host, store, unmount } = await setup({ navigationMode: 'top-bar' }, sites, 'b');
    cleanup = unmount;
    expect(frames(host)).toHaveLength(1);
    expect(frames(host)[0]!.getAttribute('data-url')).toBe('https://b.test/');
    await act(() => store.sites.set([sites[0]!]));
    expect(frames(host).map((f) => f.getAttribute('data-url'))).toEqual(['https://a.test/']);
  });

  it('freezes the iframe url after first mount', async () => {
    const { host, store, unmount } = await setup({ navigationMode: 'top-bar' });
    cleanup = unmount;
    await act(() => store.sites.set([{ ...sites[0]!, url: 'https://changed.test/' }, sites[1]!]));
    expect(frames(host)[0]!.getAttribute('data-url')).toBe('https://a.test/');
  });

  it.each([
    ['last-url', 'https://a.test/deep'],
    ['configured-url', 'https://a.test/'],
  ] as const)('uses the %s persistence for the initial url', async (persistence, expected) => {
    const store = createStore({
      local: createFakeAdapter({
        schemaVersion: 1,
        sites,
        settings: { ...DEFAULT_SETTINGS, persistence },
      }),
      session: createFakeAdapter(),
    });
    await store
      .tabState(1)
      .set({ tabId: 1, activeItemId: 'a', urlBySiteId: { a: 'https://a.test/deep' } });
    const host = document.createElement('div');
    act(() => render(<Panel tabId={1} store={store} />, host));
    await flush();
    cleanup = () => act(() => render(null, host));
    expect(frames(host)[0]!.getAttribute('data-url')).toBe(expected);
  });
});
