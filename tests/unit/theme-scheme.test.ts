import { describe, expect, it, vi } from 'vitest';
import {
  applyTokens,
  cacheTokens,
  clearTokens,
  followSystemColorScheme,
  getBrowserThemeApi,
  readCachedTokens,
  toggleSystemColors,
  watchBrowserTheme,
} from '../../lib/theme';
import type { BrowserTheme, BrowserThemeApi } from '../../lib/theme';
import { fakeMedia } from '../helpers/fakeTheme';

describe('followSystemColorScheme', () => {
  it('applies immediately, reacts live and unsubscribes', () => {
    const media = fakeMedia(true);
    const root = document.createElement('html');
    const seen: boolean[] = [];
    const stop = followSystemColorScheme(root, (dark) => seen.push(dark));
    expect(root.classList.contains('wa-dark')).toBe(true);
    media.set(false);
    expect(root.classList.contains('wa-dark')).toBe(false);
    stop();
    media.set(true);
    expect(root.classList.contains('wa-dark')).toBe(false);
    expect(seen).toEqual([true, false]);
    media.restore();
  });
});

describe('tokens', () => {
  it('applies, clears and toggles system colors', () => {
    const root = document.createElement('html');
    applyTokens(root, { '--a': '1' });
    expect(root.style.getPropertyValue('--a')).toBe('1');
    clearTokens(root, { '--a': '1' });
    expect(root.style.getPropertyValue('--a')).toBe('');
    toggleSystemColors(root, true);
    expect(root.classList.contains('sk-system-colors')).toBe(true);
    toggleSystemColors(root, false);
    expect(root.classList.contains('sk-system-colors')).toBe(false);
  });

  it('caches and reads tokens, tolerating bad storage', () => {
    const storage = window.localStorage;
    storage.clear();
    expect(readCachedTokens(storage)).toEqual({});
    cacheTokens({ '--a': '1' }, storage);
    expect(readCachedTokens(storage)).toEqual({ '--a': '1' });
    storage.setItem('sidekick:theme-tokens', '{"--a":1,"--b":"2"}');
    expect(readCachedTokens(storage)).toEqual({ '--b': '2' });
    storage.setItem('sidekick:theme-tokens', 'null');
    expect(readCachedTokens(storage)).toEqual({});
    storage.setItem('sidekick:theme-tokens', '{');
    expect(readCachedTokens(storage)).toEqual({});
    cacheTokens({}, storage);
    expect(storage.getItem('sidekick:theme-tokens')).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(readCachedTokens(broken)).toEqual({});
    expect(() => cacheTokens({ '--a': '1' }, broken)).not.toThrow();
  });
});

describe('watchBrowserTheme', () => {
  const dark: BrowserTheme = { colors: { popup: '#000000', popup_text: '#ffffff' } };

  function fakeApi(current: Promise<BrowserTheme>) {
    const listeners = new Set<(info: { theme: BrowserTheme }) => void>();
    const api: BrowserThemeApi = {
      getCurrent: () => current,
      onUpdated: {
        addListener: (listener) => void listeners.add(listener),
        removeListener: (listener) => void listeners.delete(listener),
      },
    };
    return { api, listeners };
  }

  it('emits the current theme then updates, and stops after unsubscribe', async () => {
    const { api, listeners } = fakeApi(Promise.resolve(dark));
    const onTokens = vi.fn();
    const stop = watchBrowserTheme(api, onTokens);
    await Promise.resolve();
    expect(onTokens).toHaveBeenLastCalledWith(
      expect.objectContaining({ '--wa-color-surface-default': 'rgb(0 0 0)' }),
    );
    [...listeners][0]!({ theme: {} });
    expect(onTokens).toHaveBeenLastCalledWith({});
    stop();
    expect(listeners.size).toBe(0);
    onTokens.mockClear();
    await Promise.resolve();
    expect(onTokens).not.toHaveBeenCalled();
  });

  it('falls back to no tokens when getCurrent rejects', async () => {
    const { api } = fakeApi(Promise.reject(new Error('nope')));
    const onTokens = vi.fn();
    watchBrowserTheme(api, onTokens);
    await new Promise((resolve) => setTimeout(resolve));
    expect(onTokens).toHaveBeenCalledWith({});
  });
});

describe('getBrowserThemeApi', () => {
  it('is undefined where the browser has no theme API', () => {
    expect(getBrowserThemeApi()).toBeUndefined();
  });
});
