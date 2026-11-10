import { describe, expect, it } from 'vitest';
import { applyColorScheme } from '../../lib/theme';

describe('applyColorScheme', () => {
  it('adds the dark class when the system prefers dark', () => {
    const root = document.createElement('html');
    applyColorScheme(root, true);
    expect(root.classList.contains('wa-dark')).toBe(true);
  });

  it('removes the dark class when the system prefers light', () => {
    const root = document.createElement('html');
    root.classList.add('wa-dark');
    applyColorScheme(root, false);
    expect(root.classList.contains('wa-dark')).toBe(false);
  });
});
