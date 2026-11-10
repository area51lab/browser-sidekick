import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import '../helpers/waStubs';

for (const name of [
  'radio-group',
  'radio',
  'switch',
  'details',
  'button',
  'callout',
  'input',
  'spinner',
]) {
  vi.doMock(`@awesome.me/webawesome/dist/components/${name}/${name}.js`, () => ({}));
}
vi.doMock('wxt/browser', () => ({
  browser: { runtime: { getManifest: () => ({ version: '9.8.7' }) } },
}));

const { SettingsPage } = await import('../../components/settings/SettingsPage');
const { AboutSection, SOURCE_URL } = await import('../../components/settings/AboutSection');
const { createStore, createEntry, DEFAULT_SETTINGS } = await import('../../lib/storage');
const { createFakeAdapter } = await import('../helpers/fakeStorage');

class StubSwitch extends HTMLElement {
  checked = false;
}
class StubGroup extends HTMLElement {
  value = '';
}
if (!customElements.get('wa-switch')) customElements.define('wa-switch', StubSwitch);
if (!customElements.get('wa-radio-group')) customElements.define('wa-radio-group', StubGroup);

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

const newStore = (settings?: Record<string, unknown>) =>
  createStore({
    local: createFakeAdapter(settings ? { schemaVersion: 1, settings } : {}),
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

const group = (name: string) =>
  host.querySelector(`wa-radio-group[name="${name}"]`) as (HTMLElement & { value: string }) | null;
const choose = async (name: string, value: string) => {
  const el = group(name)!;
  el.value = value;
  act(() => void el.dispatchEvent(new Event('change')));
  await flush();
};
const themeSwitch = () =>
  host.querySelector('wa-switch[name="useBrowserThemeColors"]') as HTMLElement & {
    checked: boolean;
  };

describe('options page', () => {
  it('renders the three sections with labelled groups', async () => {
    await mountNode(<SettingsPage store={newStore()} />);
    const headings = [...host.querySelectorAll('h2')].map((h) => h.textContent);
    expect(headings).toEqual(['General', 'Sites', 'About']);
    expect(group('navigationMode')?.getAttribute('label')).toBe('Navigation');
    expect(group('persistence')?.getAttribute('label')).toBe('When opening a site');
    expect(group('navigationMode')?.querySelectorAll('wa-radio')).toHaveLength(3);
  });

  it('reflects stored settings', async () => {
    await mountNode(
      <SettingsPage
        store={newStore({
          navigationMode: 'icon-sidebar',
          topBarDisplay: 'names',
          persistence: 'configured-url',
        })}
      />,
    );
    expect(group('navigationMode')?.value).toBe('icon-sidebar');
    expect(group('persistence')?.value).toBe('configured-url');
  });

  it.each([
    ['navigationMode', 'icon-sidebar'],
    ['persistence', 'configured-url'],
  ] as const)('persists %s', async (key, value) => {
    const store = newStore();
    await mountNode(<SettingsPage store={store} />);
    await choose(key, value);
    expect((await store.settings.get())[key]).toBe(value);
  });

  it('ignores a change event that keeps the same value', async () => {
    const store = newStore();
    const spy = vi.spyOn(store.settings, 'update');
    await mountNode(<SettingsPage store={store} />);
    await choose('navigationMode', 'dropdown');
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows the top bar display only when top bar is selected and persists it', async () => {
    const store = newStore();
    await mountNode(<SettingsPage store={store} />);
    expect(group('topBarDisplay')).toBeNull();

    await choose('navigationMode', 'top-bar');
    expect(group('topBarDisplay')).not.toBeNull();
    await choose('topBarDisplay', 'names');
    expect((await store.settings.get()).topBarDisplay).toBe('names');

    await choose('navigationMode', 'dropdown');
    expect(group('topBarDisplay')).toBeNull();
    expect((await store.settings.get()).topBarDisplay).toBe('names');
  });

  it('follows changes made elsewhere live', async () => {
    const store = newStore();
    await mountNode(<SettingsPage store={store} />);
    await act(() => store.settings.update((s) => ({ ...s, navigationMode: 'top-bar' })));
    await flush();
    expect(group('navigationMode')?.value).toBe('top-bar');
    expect(group('topBarDisplay')).not.toBeNull();
  });

  it('disables the theme switch while the field does not exist', async () => {
    await mountNode(<SettingsPage store={newStore()} />);
    expect(themeSwitch().hasAttribute('disabled')).toBe(true);
    expect(host.textContent).toContain('Not available in this version');
  });

  it('reads and writes useBrowserThemeColors when the field exists', async () => {
    const local = createFakeAdapter({
      schemaVersion: 1,
      settings: { useBrowserThemeColors: false },
    });
    const base = createStore({ local, session: createFakeAdapter() });
    const store = {
      ...base,
      settings: createEntry(local, 'settings', (raw) => ({
        ...DEFAULT_SETTINGS,
        ...(raw as object),
      })),
    };
    await mountNode(<SettingsPage store={store} />);
    const control = themeSwitch();
    expect(control.hasAttribute('disabled')).toBe(false);
    expect(control.checked).toBe(false);

    control.checked = true;
    act(() => void control.dispatchEvent(new Event('change')));
    await flush();
    expect(local.data.settings).toMatchObject({
      useBrowserThemeColors: true,
      navigationMode: 'dropdown',
    });
    expect(themeSwitch().checked).toBe(true);

    await choose('navigationMode', 'top-bar');
    expect(local.data.settings).toMatchObject({
      useBrowserThemeColors: true,
      navigationMode: 'top-bar',
    });
  });
});

describe('about section', () => {
  it('shows the manifest version and source link', async () => {
    await mountNode(<AboutSection />);
    expect(host.textContent).toContain('9.8.7');
    expect(host.querySelector('a')?.getAttribute('href')).toBe(SOURCE_URL);
  });

  it('accepts an explicit version', async () => {
    await mountNode(<AboutSection version="1.2.3" />);
    expect(host.textContent).toContain('1.2.3');
  });
});
