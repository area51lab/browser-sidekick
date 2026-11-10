import { render } from 'preact';
import type { ComponentChild } from 'preact';
import '../assets/base.css';
import { followSystemColorScheme } from './theme';

export function mount(view: ComponentChild): void {
  followSystemColorScheme();
  render(view, document.getElementById('app')!);
}
