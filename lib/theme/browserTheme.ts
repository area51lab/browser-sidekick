import { browser } from 'wxt/browser';
import { mapBrowserTheme } from './mapping';
import type { BrowserThemeColors, ThemeTokens } from './mapping';

export interface BrowserTheme {
  colors?: BrowserThemeColors | null;
}

export interface BrowserThemeApi {
  getCurrent(): Promise<BrowserTheme>;
  onUpdated: {
    addListener(listener: (info: { theme: BrowserTheme }) => void): void;
    removeListener(listener: (info: { theme: BrowserTheme }) => void): void;
  };
}

/** Only Firefox exposes `theme`; on Chrome this is undefined. */
export const getBrowserThemeApi = (): BrowserThemeApi | undefined =>
  (browser as unknown as { theme?: BrowserThemeApi } | undefined)?.theme;

export function watchBrowserTheme(
  api: BrowserThemeApi,
  onTokens: (tokens: ThemeTokens) => void,
): () => void {
  let active = true;
  const emit = (theme: BrowserTheme) => active && onTokens(mapBrowserTheme(theme.colors));
  const listener = ({ theme }: { theme: BrowserTheme }) => emit(theme);
  api.onUpdated.addListener(listener);
  void api.getCurrent().then(emit, () => emit({}));
  return () => {
    active = false;
    api.onUpdated.removeListener(listener);
  };
}
