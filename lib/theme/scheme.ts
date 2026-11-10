export const DARK_CLASS = 'wa-dark';
export const SYSTEM_COLORS_CLASS = 'sk-system-colors';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function applyColorScheme(root: HTMLElement, prefersDark: boolean): void {
  root.classList.toggle(DARK_CLASS, prefersDark);
}

/** Applies the current scheme at once and keeps it in sync; returns the unsubscribe function. */
export function followSystemColorScheme(
  root: HTMLElement = document.documentElement,
  onChange?: (prefersDark: boolean) => void,
): () => void {
  const query = window.matchMedia(DARK_QUERY);
  const sync = (prefersDark: boolean) => {
    applyColorScheme(root, prefersDark);
    onChange?.(prefersDark);
  };
  const listener = (event: MediaQueryListEvent) => sync(event.matches);
  sync(query.matches);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
