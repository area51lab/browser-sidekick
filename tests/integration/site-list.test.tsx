import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import '../helpers/waStubs';
import { SiteList } from '../../components/SiteList';
import { SitesSection } from '../../components/SitesSection';
import { createStore } from '../../lib/storage';
import type { Site } from '../../lib/storage';
import { createFakeAdapter } from '../helpers/fakeStorage';

vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/callout/callout.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/input/input.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/spinner/spinner.js', () => ({}));

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

const make = (id: string, over: Partial<Site> = {}): Site => ({
  id,
  url: `https://${id}.test/`,
  title: id.toUpperCase(),
  createdAt: 1,
  ...over,
});

const newStore = (sites: Site[]) =>
  createStore({
    local: createFakeAdapter(sites.length ? { schemaVersion: 1, sites } : {}),
    session: createFakeAdapter(),
  });

let host: HTMLElement;
afterEach(() => host && act(() => render(null, host)));

async function mountNode(node: preact.ComponentChild) {
  host = document.createElement('div');
  document.body.append(host);
  act(() => render(node, host));
  await flush();
}

const names = () => [...host.querySelectorAll('.site-row strong')].map((el) => el.textContent);
const button = (label: string, within: ParentNode = host) =>
  [...within.querySelectorAll('wa-button')].find(
    (el) => el.textContent === label || el.getAttribute('aria-label') === label,
  ) as HTMLElement;
const row = (index: number) => host.querySelectorAll('.site-row')[index] as HTMLElement;
const click = async (el: HTMLElement) => {
  act(() => el.click());
  await flush();
};

describe('SiteList', () => {
  it('shows an empty state', async () => {
    await mountNode(<SiteList store={newStore([])} />);
    expect(host.textContent).toContain('No sites yet');
  });

  it('lists sites using the custom name when set', async () => {
    const store = newStore([
      make('a', { customName: 'Mine', faviconUrl: 'https://a.test/i.png' }),
      make('b'),
    ]);
    await mountNode(<SiteList store={store} />);
    expect(names()).toEqual(['Mine', 'B']);
    expect(row(0).querySelector('img')?.getAttribute('src')).toBe('https://a.test/i.png');
    expect(row(1).querySelector('[data-testid="site-icon-empty"]')).not.toBeNull();
    expect(row(1).textContent).toContain('https://b.test/');
  });

  it('reorders with up and down and disables the edges', async () => {
    const store = newStore([make('a'), make('b'), make('c')]);
    await mountNode(<SiteList store={store} />);
    expect(button('Move A up').hasAttribute('disabled')).toBe(true);
    expect(button('Move C down').hasAttribute('disabled')).toBe(true);

    await click(button('Move C up'));
    expect(names()).toEqual(['A', 'C', 'B']);
    await click(button('Move A down'));
    expect(names()).toEqual(['C', 'A', 'B']);
    expect((await store.sites.get()).map((s) => s.id)).toEqual(['c', 'a', 'b']);
  });

  it('asks for confirmation before deleting', async () => {
    const onRemove = vi.fn();
    const store = newStore([make('a'), make('b')]);
    await mountNode(<SiteList store={store} onRemove={onRemove} />);

    await click(button('Delete', row(0)));
    expect(host.textContent).toContain('Delete?');
    await click(button('Cancel', row(0)));
    expect(names()).toEqual(['A', 'B']);
    expect(onRemove).not.toHaveBeenCalled();

    await click(button('Delete', row(0)));
    await click(button('Confirm', row(0)));
    expect(names()).toEqual(['B']);
    expect((await store.sites.get()).map((s) => s.id)).toEqual(['b']);
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  it('reports the site to edit', async () => {
    const onEdit = vi.fn();
    await mountNode(<SiteList store={newStore([make('a')])} onEdit={onEdit} />);
    await click(button('Edit'));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  it('tolerates missing callbacks', async () => {
    await mountNode(<SiteList store={newStore([make('a')])} />);
    await click(button('Edit'));
    await click(button('Delete'));
    await click(button('Confirm'));
    expect(host.textContent).toContain('No sites yet');
  });
});

describe('SitesSection', () => {
  const props = (store: ReturnType<typeof newStore>) => ({
    store,
    requestOrigin: async () => true,
    fetchMetadata: async () => ({ title: 'Fetched', faviconUrl: 'https://x.test/i.png' }),
  });
  const input = (name: string) =>
    host.querySelector(`wa-input[name="${name}"]`) as HTMLInputElement;

  it('switches the form to edit mode, saves, and returns to add mode', async () => {
    const store = newStore([make('a')]);
    await mountNode(<SitesSection {...props(store)} />);
    expect(host.querySelector('h2')?.textContent).toBe('Sites');
    expect(host.querySelector('form')?.getAttribute('aria-label')).toBe('Add site');

    await click(button('Edit'));
    expect(host.querySelector('form')?.getAttribute('aria-label')).toBe('Edit site');
    expect(input('url').value).toBe('https://a.test/');

    act(() => {
      input('name').value = 'Renamed';
      input('name').dispatchEvent(new Event('input'));
    });
    act(
      () =>
        void host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true })),
    );
    await flush();

    expect(names()).toEqual(['Renamed']);
    expect(host.querySelector('form')?.getAttribute('aria-label')).toBe('Add site');
  });

  it('leaves edit mode when the edited site is deleted but not when another is', async () => {
    const store = newStore([make('a'), make('b')]);
    await mountNode(<SitesSection {...props(store)} />);

    await click(button('Edit', row(0)));
    await click(button('Delete', row(1)));
    await click(button('Confirm', row(1)));
    expect(host.querySelector('form')?.getAttribute('aria-label')).toBe('Edit site');

    await click(button('Delete', row(0)));
    await click(button('Confirm', row(0)));
    expect(host.querySelector('form')?.getAttribute('aria-label')).toBe('Add site');
  });
});
