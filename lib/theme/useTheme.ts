import { useEffect, useMemo, useState } from 'preact/hooks';
import { useSettings } from '../storage/hooks';
import type { Store } from '../storage/store';
import { getBrowserThemeApi, watchBrowserTheme } from './browserTheme';
import type { BrowserThemeApi } from './browserTheme';
import type { ThemeTokens } from './mapping';
import { followSystemColorScheme } from './scheme';
import {
  applyTokens,
  cacheTokens,
  clearTokens,
  readCachedTokens,
  toggleSystemColors,
} from './tokens';

const EMPTY_TOKENS: ThemeTokens = {};

export type ColorScheme = 'light' | 'dark';
export type ThemeSource = 'default' | 'system' | 'browser';

export interface Theme {
  scheme: ColorScheme;
  source: ThemeSource;
  tokens: ThemeTokens;
}

export interface UseThemeOptions {
  root?: HTMLElement;
  store?: Store;
  api?: BrowserThemeApi | null;
}

/**
 * Keeps the document in sync with the browser appearance: the Web Awesome light/dark class
 * follows `prefers-color-scheme`, and, unless `settings.useBrowserThemeColors` is false, the
 * Firefox theme colors (or CSS system colors elsewhere) are applied on top.
 */
export function useTheme({ root, store, api }: UseThemeOptions = {}): Theme {
  const target = root ?? document.documentElement;
  const enabled = useSettings(store).value.useBrowserThemeColors !== false;
  const themeApi = api === undefined ? getBrowserThemeApi() : (api ?? undefined);
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [tokens, setTokens] = useState<ThemeTokens>(() => readCachedTokens());

  useEffect(() => followSystemColorScheme(target, setPrefersDark), [target]);

  useEffect(() => {
    if (!enabled || !themeApi) return;
    return watchBrowserTheme(themeApi, (next) => {
      setTokens(next);
      cacheTokens(next);
    });
  }, [enabled, themeApi]);

  const applied = useMemo(
    () => (enabled && themeApi ? tokens : EMPTY_TOKENS),
    [enabled, themeApi, tokens],
  );

  useEffect(() => {
    applyTokens(target, applied);
    return () => clearTokens(target, applied);
  }, [target, applied]);

  useEffect(() => {
    toggleSystemColors(target, enabled && !themeApi);
  }, [target, enabled, themeApi]);

  const source: ThemeSource = !enabled ? 'default' : themeApi ? 'browser' : 'system';
  return { scheme: prefersDark ? 'dark' : 'light', source, tokens: applied };
}
