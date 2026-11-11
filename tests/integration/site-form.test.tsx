import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import '../helpers/waStubs';
import { SiteForm } from '../../components/SiteForm';
import type { SiteFormProps } from '../../components/SiteForm';
import { createStore } from '../../lib/storage';
import type { Site } from '../../lib/storage';
import type { SiteMetadata } from '../../lib/siteMetadata';
import { createFakeAdapter } from '../helpers/fakeStorage';

vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/callout/callout.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/input/input.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/spinner/spinner.js', () => ({}));

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

const newStore = (sites: Site[] = []) => {
  const local = createFakeAdapter(sites.length ? { schemaVersion: 1, sites } : {});
  return createStore({ local, session: createFakeAdapter() });
};

const existing: Site = {
  id: 'a',
  url: 'https://a.test/',
  title: 'A Title',
  customName: 'My A',
  faviconUrl: 'https://a.test/a.png',
  createdAt: 1,
};

const metadata = (over: Partial<SiteMetadata> = {}): SiteMetadata => ({
  title: 'Example',
  faviconUrl: 'https://example.com/icon.png',
  ...over,
});

let host: HTMLElement;
afterEach(() => host && act(() => render(null, host)));

async function setup(props: Partial<SiteFormProps> = {}) {
  const store = props.store ?? newStore();
  const requestOrigin = vi.fn(async () => true);
  const fetchMetadata = vi.fn(async () => metadata());
  host = document.createElement('div');
  document.body.append(host);
  act(() =>
    render(
      <SiteForm
        store={store}
        requestOrigin={requestOrigin}
        fetchMetadata={fetchMetadata}
        {...props}
      />,
      host,
    ),
  );
  await flush();
  return { store, requestOrigin, fetchMetadata };
}

const input = (name: string) => host.querySelector(`wa-input[name="${name}"]`) as HTMLInputElement;
const type = (name: string, value: string) =>
  act(() => {
    const el = input(name);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
const blur = async (name: string) => {
  act(() => void input(name).dispatchEvent(new Event('blur')));
  await flush();
};
const submit = async () => {
  act(
    () => void host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true })),
  );
  await flush();
};
const button = (label: string) =>
  [...host.querySelectorAll('wa-button')].find((el) => el.textContent === label) as HTMLElement;
const saved = async (store: ReturnType<typeof newStore>) => store.sites.get();

describe('SiteForm: adding', () => {
  it('requests the origin, fetches metadata on blur and prefills name and icon', async () => {
    const { requestOrigin, fetchMetadata } = await setup();
    await type('url', 'example.com');
    await blur('url');

    expect(requestOrigin).toHaveBeenCalledWith('https://example.com/');
    expect(fetchMetadata).toHaveBeenCalledWith('https://example.com/');
    expect(input('url').value).toBe('https://example.com/');
    expect(input('name').value).toBe('Example');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('https://example.com/icon.png');
    expect(host.querySelector('wa-spinner')).toBeNull();
    expect(host.querySelector('wa-callout')).toBeNull();
  });

  it('shows a loading state while fetching', async () => {
    let finish!: (value: SiteMetadata) => void;
    const fetchMetadata = vi.fn(() => new Promise<SiteMetadata>((resolve) => (finish = resolve)));
    await setup({ fetchMetadata });
    await type('url', 'example.com');
    await blur('url');
    expect(host.querySelector('wa-spinner')).not.toBeNull();
    expect(host.textContent).toContain('Loading site details');
    expect(button('Add site').hasAttribute('disabled')).toBe(false);
    finish(metadata());
    await flush();
    expect(host.querySelector('wa-spinner')).toBeNull();
  });

  it('saves the site when the submit arrives while the blur load is in flight', async () => {
    let finish!: (value: SiteMetadata) => void;
    const fetchMetadata = vi.fn(() => new Promise<SiteMetadata>((resolve) => (finish = resolve)));
    const onDone = vi.fn();
    const { store, requestOrigin } = await setup({ fetchMetadata, onDone });
    await type('url', 'example.com');
    await blur('url');
    await submit();
    expect(await saved(store)).toEqual([]);

    finish(metadata());
    await flush();

    expect(requestOrigin).toHaveBeenCalledOnce();
    expect(fetchMetadata).toHaveBeenCalledOnce();
    const sites = await saved(store);
    expect(sites).toHaveLength(1);
    expect(sites[0]).toMatchObject({ url: 'https://example.com/', title: 'Example' });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('saves with the hostname fallback when the in-flight load fails', async () => {
    let finish!: (value: SiteMetadata) => void;
    const fetchMetadata = vi.fn(() => new Promise<SiteMetadata>((resolve) => (finish = resolve)));
    const { store } = await setup({ fetchMetadata });
    await type('url', 'example.com');
    await blur('url');
    await submit();
    finish({
      title: 'example.com',
      faviconUrl: 'https://example.com/favicon.ico',
      error: 'timeout',
    });
    await flush();
    expect((await saved(store))[0]).toMatchObject({
      url: 'https://example.com/',
      title: 'example.com',
      faviconUrl: 'https://example.com/favicon.ico',
    });
  });

  it('saves a site without customName when the name is unchanged, then resets', async () => {
    const onDone = vi.fn();
    const { store } = await setup({ onDone });
    await type('url', 'example.com');
    await blur('url');
    await submit();

    const [site] = await saved(store);
    expect(site).toMatchObject({
      url: 'https://example.com/',
      title: 'Example',
      faviconUrl: 'https://example.com/icon.png',
    });
    expect(site?.customName).toBeUndefined();
    expect(site?.id).toBeTruthy();
    expect(onDone).toHaveBeenCalledOnce();
    expect(input('url').value).toBe('');
    expect(input('name').value).toBe('');
    expect(host.querySelector('.site-form__preview .site-icon')).toBeNull();
  });

  it('stores an edited name as customName and keeps it across later fetches', async () => {
    const { store, fetchMetadata } = await setup();
    await type('url', 'example.com');
    await blur('url');
    await type('name', '  Mine  ');
    await type('url', 'other.com');
    await blur('url');
    expect(fetchMetadata).toHaveBeenCalledTimes(2);
    expect(input('name').value).toBe('  Mine  ');
    await submit();

    const [site] = await saved(store);
    expect(site?.customName).toBe('Mine');
    expect(site?.title).toBe('Example');
  });

  it('treats a name equal to the title as not custom', async () => {
    const { store } = await setup();
    await type('url', 'example.com');
    await blur('url');
    await type('name', 'Example');
    await submit();
    expect((await saved(store))[0]?.customName).toBeUndefined();
  });

  it('loads metadata on submit when the field was never blurred', async () => {
    const { store, fetchMetadata } = await setup();
    await type('url', 'example.com');
    await submit();
    expect(fetchMetadata).toHaveBeenCalledOnce();
    expect(await saved(store)).toHaveLength(1);
  });

  it('does not refetch an unchanged URL', async () => {
    const { fetchMetadata } = await setup();
    await type('url', 'example.com');
    await blur('url');
    await blur('url');
    await submit();
    expect(fetchMetadata).toHaveBeenCalledOnce();
  });

  it('ignores blur on an empty field', async () => {
    const { requestOrigin } = await setup();
    await blur('url');
    expect(requestOrigin).not.toHaveBeenCalled();
    expect(host.querySelector('wa-callout')).toBeNull();
  });

  it('rejects invalid URLs without requesting permission or saving', async () => {
    const { store, requestOrigin } = await setup();
    await type('url', 'javascript:alert(1)');
    await blur('url');
    expect(host.querySelector('wa-callout')?.textContent).toContain('valid http(s) address');
    await submit();
    expect(requestOrigin).not.toHaveBeenCalled();
    expect(await saved(store)).toEqual([]);
  });

  it('warns about sites known to block embedding but still lets them be added', async () => {
    const { store } = await setup();
    await type('url', 'https://mail.google.com/mail/u/0/');
    await blur('url');
    expect(host.querySelector('wa-callout')?.textContent).toContain('block embedding');
    await submit();
    expect(await saved(store)).toMatchObject([{ url: 'https://mail.google.com/mail/u/0/' }]);
  });

  it('skips fetching when permission is denied and falls back to the hostname', async () => {
    const requestOrigin = vi.fn(async () => false);
    const { store, fetchMetadata } = await setup({ requestOrigin });
    await type('url', 'example.com');
    await blur('url');
    expect(fetchMetadata).not.toHaveBeenCalled();
    expect(host.querySelector('wa-callout')?.textContent).toContain('not granted');
    expect(input('name').value).toBe('example.com');
    await submit();
    expect(await saved(store)).toMatchObject([{ title: 'example.com' }]);
  });

  it('keeps partial results and warns when metadata fails', async () => {
    const fetchMetadata = vi.fn(async () =>
      metadata({
        title: 'example.com',
        faviconUrl: 'https://example.com/favicon.ico',
        error: 'network',
      }),
    );
    const { store } = await setup({ fetchMetadata });
    await type('url', 'example.com');
    await blur('url');
    expect(host.querySelector('wa-callout')?.textContent).toContain('Could not load');
    expect(input('name').value).toBe('example.com');
    await submit();
    expect(await saved(store)).toMatchObject([{ faviconUrl: 'https://example.com/favicon.ico' }]);
  });

  it('ignores stale metadata responses', async () => {
    const pending: Array<(value: SiteMetadata) => void> = [];
    const fetchMetadata = vi.fn(
      () => new Promise<SiteMetadata>((resolve) => pending.push(resolve)),
    );
    await setup({ fetchMetadata });
    await type('url', 'one.com');
    await blur('url');
    await type('url', 'two.com');
    await blur('url');
    pending[1]?.(metadata({ title: 'Two' }));
    await flush();
    pending[0]?.(metadata({ title: 'One' }));
    await flush();
    expect(input('name').value).toBe('Two');
    expect(input('url').value).toBe('https://two.com/');
  });

  it('falls back to a placeholder icon when the image fails to load', async () => {
    await setup();
    await type('url', 'example.com');
    await blur('url');
    act(() => void host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('[data-testid="site-icon-empty"]')).not.toBeNull();
  });
});

describe('SiteForm: editing', () => {
  it('prefills from the site and updates it in place', async () => {
    const store = newStore([existing, { ...existing, id: 'b', customName: undefined }]);
    const onDone = vi.fn();
    const { requestOrigin } = await setup({ store, site: existing, onDone });
    expect(input('url').value).toBe('https://a.test/');
    expect(input('name').value).toBe('My A');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('https://a.test/a.png');

    await type('name', 'Renamed');
    await submit();

    const sites = await saved(store);
    expect(sites[0]).toMatchObject({
      id: 'a',
      customName: 'Renamed',
      title: 'A Title',
      createdAt: 1,
    });
    expect(sites[1]?.id).toBe('b');
    expect(requestOrigin).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledOnce();
    expect(input('url').value).toBe('https://a.test/');
  });

  it('clears customName when the name is emptied', async () => {
    const store = newStore([existing]);
    await setup({ store, site: existing });
    await type('name', '');
    await submit();
    expect((await saved(store))[0]?.customName).toBeUndefined();
  });

  it('refetches when the URL changes and keeps an existing custom name', async () => {
    const store = newStore([existing]);
    const { fetchMetadata } = await setup({ store, site: existing });
    await type('url', 'new.test');
    await blur('url');
    expect(fetchMetadata).toHaveBeenCalledWith('https://new.test/');
    expect(input('name').value).toBe('My A');
    await submit();
    expect(await saved(store)).toMatchObject([
      { url: 'https://new.test/', title: 'Example', customName: 'My A' },
    ]);
  });

  it('prefills the name from the title when there is no custom name', async () => {
    const plain = { ...existing, customName: undefined };
    await setup({ store: newStore([plain]), site: plain });
    expect(input('name').value).toBe('A Title');
  });

  it('cancels through onDone without saving', async () => {
    const store = newStore([existing]);
    const onDone = vi.fn();
    await setup({ store, site: existing, onDone });
    await type('name', 'Changed');
    act(() => button('Cancel').click());
    expect(onDone).toHaveBeenCalledOnce();
    expect((await saved(store))[0]?.customName).toBe('My A');
  });
});
