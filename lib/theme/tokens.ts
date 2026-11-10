import type { ThemeTokens } from './mapping';
import { SYSTEM_COLORS_CLASS } from './scheme';

const CACHE_KEY = 'sidekick:theme-tokens';

export function applyTokens(root: HTMLElement, tokens: ThemeTokens): void {
  Object.entries(tokens).forEach(([name, value]) => root.style.setProperty(name, value));
}

export function clearTokens(root: HTMLElement, tokens: ThemeTokens): void {
  Object.keys(tokens).forEach((name) => root.style.removeProperty(name));
}

export const toggleSystemColors = (root: HTMLElement, enabled: boolean): void =>
  void root.classList.toggle(SYSTEM_COLORS_CLASS, enabled);

export function cacheTokens(tokens: ThemeTokens, storage: Storage = localStorage): void {
  try {
    if (Object.keys(tokens).length === 0) storage.removeItem(CACHE_KEY);
    else storage.setItem(CACHE_KEY, JSON.stringify(tokens));
  } catch {
    return;
  }
}

/** Reads tokens cached by a previous session so the first paint already matches the browser theme. */
export function readCachedTokens(storage: Storage = localStorage): ThemeTokens {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(CACHE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}
