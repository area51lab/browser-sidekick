import { describe, expect, it } from 'vitest';
import {
  NAVIGATION_CHOICES,
  PERSISTENCE_CHOICES,
  TOP_BAR_CHOICES,
  showsTopBarDisplay,
  supportsThemeColors,
} from '../../components/settings/options';
import {
  DEFAULT_SETTINGS,
  NAVIGATION_MODES,
  PERSISTENCE_MODES,
  TOP_BAR_DISPLAYS,
} from '../../lib/storage';

describe('settings options', () => {
  it('offers exactly the storage values', () => {
    expect(NAVIGATION_CHOICES.map((c) => c.value)).toEqual([...NAVIGATION_MODES]);
    expect(TOP_BAR_CHOICES.map((c) => c.value)).toEqual([...TOP_BAR_DISPLAYS]);
    expect(PERSISTENCE_CHOICES.map((c) => c.value)).toEqual([...PERSISTENCE_MODES]);
  });

  it('shows the top bar display only for the top bar', () => {
    expect(showsTopBarDisplay({ ...DEFAULT_SETTINGS, navigationMode: 'top-bar' })).toBe(true);
    expect(showsTopBarDisplay({ ...DEFAULT_SETTINGS, navigationMode: 'dropdown' })).toBe(false);
    expect(showsTopBarDisplay({ ...DEFAULT_SETTINGS, navigationMode: 'icon-sidebar' })).toBe(false);
  });

  it('detects the theme colors field', () => {
    expect(supportsThemeColors(DEFAULT_SETTINGS)).toBe(false);
    expect(supportsThemeColors({ ...DEFAULT_SETTINGS, useBrowserThemeColors: false })).toBe(true);
  });
});
