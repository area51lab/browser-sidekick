const DARK_CLASS = 'wa-dark';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function applyColorScheme(root: HTMLElement, prefersDark: boolean): void {
  root.classList.toggle(DARK_CLASS, prefersDark);
}

export function followSystemColorScheme(root: HTMLElement = document.documentElement): void {
  const query = window.matchMedia(DARK_QUERY);
  applyColorScheme(root, query.matches);
  query.addEventListener('change', (event) => applyColorScheme(root, event.matches));
}
