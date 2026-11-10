import { act } from 'preact/test-utils';
import { render } from 'preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from '../../lib/theme';
import type { Theme, UseThemeOptions } from '../../lib/theme';
import { createStore } from '../../lib/storage';
import { createFakeAdapter } from '../helpers/fakeStorage';
import { fakeMedia, fakeThemeApi } from '../helpers/fakeTheme';

const darkTheme = {
  colors: { popup: '#1c1b22', popup_text: '#fbfbfe', icons_attention: '#00ddff' },
};

let media: ReturnType<typeof fakeMedia>;
let host: HTMLElement;
let root: HTMLElement;
let latest: Theme;

beforeEach(() => {
  media = fakeMedia(false);
  host = document.createElement('div');
  root = document.createElement('html');
  window.localStorage.clear();
});

afterEach(() => {
  render(null, host);
  media.restore();
});

function Probe(options: UseThemeOptions) {
  latest = useTheme(options);
  return null;
}

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve)));

async function mountTheme(options: UseThemeOptions, settings?: unknown) {
  const local = createFakeAdapter(settings === undefined ? {} : { settings });
  const store = createStore({ local, session: createFakeAdapter() });
  await act(async () => {
    render(<Probe {...options} store={store} root={root} />, host);
  });
  await flush();
  return { local, store };
}

describe('useTheme', () => {
  it('follows live scheme changes', async () => {
    await mountTheme({ api: null });
    expect(latest.scheme).toBe('light');
    expect(root.classList.contains('wa-dark')).toBe(false);
    await act(async () => media.set(true));
    expect(latest.scheme).toBe('dark');
    expect(root.classList.contains('wa-dark')).toBe(true);
  });

  it('applies Firefox theme colors and reacts to updates', async () => {
    const firefox = fakeThemeApi(darkTheme);
    await mountTheme({ api: firefox.api });
    expect(latest.source).toBe('browser');
    expect(root.style.getPropertyValue('--wa-color-surface-default')).toBe('rgb(28 27 34)');
    expect(window.localStorage.getItem('sidekick:theme-tokens')).toContain('rgb(28 27 34)');

    await act(async () => firefox.emit({ colors: { popup: '#ffffff', popup_text: '#000000' } }));
    expect(root.style.getPropertyValue('--wa-color-surface-default')).toBe('rgb(255 255 255)');
    expect(root.style.getPropertyValue('--wa-color-brand-fill-loud')).toBe('');

    await act(async () => firefox.emit({ colors: null }));
    expect(root.style.getPropertyValue('--wa-color-surface-default')).toBe('');
  });

  it('uses CSS system colors when the browser has no theme API', async () => {
    await mountTheme({ api: null });
    expect(latest.source).toBe('system');
    expect(root.classList.contains('sk-system-colors')).toBe(true);
  });

  it('keeps default tokens when useBrowserThemeColors is false', async () => {
    const firefox = fakeThemeApi(darkTheme);
    await mountTheme({ api: firefox.api }, { useBrowserThemeColors: false });
    expect(latest.source).toBe('default');
    expect(latest.tokens).toEqual({});
    expect(root.style.getPropertyValue('--wa-color-surface-default')).toBe('');
    expect(root.classList.contains('sk-system-colors')).toBe(false);
    expect(firefox.listenerCount()).toBe(0);
  });

  it('reacts when the setting is toggled', async () => {
    const firefox = fakeThemeApi(darkTheme);
    const { store } = await mountTheme({ api: firefox.api });
    expect(root.style.getPropertyValue('--wa-color-surface-default')).not.toBe('');
    await act(async () => {
      await store.settings.update((current) => ({ ...current, useBrowserThemeColors: false }));
    });
    await flush();
    expect(root.style.getPropertyValue('--wa-color-surface-default')).toBe('');
    expect(firefox.listenerCount()).toBe(0);
  });

  it('starts from cached tokens and unsubscribes on unmount', async () => {
    window.localStorage.setItem(
      'sidekick:theme-tokens',
      JSON.stringify({ '--wa-color-surface-default': 'rgb(1 2 3)' }),
    );
    const firefox = fakeThemeApi({});
    await mountTheme({ api: firefox.api });
    expect(root.style.getPropertyValue('--wa-color-surface-default')).toBe('');
    await act(async () => render(null, host));
    expect(firefox.listenerCount()).toBe(0);
  });
});
