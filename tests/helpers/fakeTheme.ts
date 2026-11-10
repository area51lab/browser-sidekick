import type { BrowserTheme, BrowserThemeApi } from '../../lib/theme';

export function fakeMedia(initial: boolean) {
  const original = window.matchMedia;
  let matches = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      void listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      void listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
    restore() {
      window.matchMedia = original;
    },
  };
}

export function fakeThemeApi(initial: BrowserTheme = {}) {
  const listeners = new Set<(info: { theme: BrowserTheme }) => void>();
  const api: BrowserThemeApi = {
    getCurrent: async () => initial,
    onUpdated: {
      addListener: (listener) => void listeners.add(listener),
      removeListener: (listener) => void listeners.delete(listener),
    },
  };
  return {
    api,
    emit: (theme: BrowserTheme) => listeners.forEach((listener) => listener({ theme })),
    listenerCount: () => listeners.size,
  };
}
