import { render } from 'preact';
import type { ComponentChild } from 'preact';
import '../assets/base.css';
import { applyTokens, followSystemColorScheme, readCachedTokens, useTheme } from './theme';

function ThemeRoot({ children }: { children: ComponentChild }) {
  useTheme();
  return <>{children}</>;
}

export function mount(view: ComponentChild): void {
  followSystemColorScheme();
  applyTokens(document.documentElement, readCachedTokens());
  render(<ThemeRoot>{view}</ThemeRoot>, document.getElementById('app')!);
}
