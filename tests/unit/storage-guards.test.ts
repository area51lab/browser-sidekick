import { describe, expect, it } from 'vitest';
import {
  isNotes,
  isSite,
  isPanelState,
  parseNotes,
  parseSettings,
  parseSites,
  parsePanelState,
} from '../../lib/storage/guards';
import { DEFAULT_NOTES, DEFAULT_SETTINGS, defaultPanelState } from '../../lib/storage/types';

const site = { id: 'a', url: 'https://a.test', title: 'A', createdAt: 1 };

describe('guards', () => {
  it('validates sites', () => {
    expect(isSite(site)).toBe(true);
    expect(isSite({ ...site, customName: 'x', faviconUrl: 'y' })).toBe(true);
    expect(isSite({ ...site, customName: 3 })).toBe(false);
    expect(isSite({ ...site, faviconUrl: 3 })).toBe(false);
    expect(isSite({ ...site, createdAt: '1' })).toBe(false);
    expect(isSite({ ...site, id: 1 })).toBe(false);
    expect(isSite(null)).toBe(false);
    expect(isSite([site])).toBe(false);
  });

  it('validates notes and panel state', () => {
    expect(isNotes({ markdown: '', updatedAt: 0 })).toBe(true);
    expect(isNotes({ markdown: 1, updatedAt: 0 })).toBe(false);
    expect(isPanelState({ activeItemId: 'a', urlBySiteId: { a: 'u' } })).toBe(true);
    expect(isPanelState({ activeItemId: 'a', urlBySiteId: { a: 1 } })).toBe(false);
    expect(isPanelState({ activeItemId: 'a', urlBySiteId: [] })).toBe(false);
    expect(isPanelState({ activeItemId: 1, urlBySiteId: {} })).toBe(false);
  });

  it('parses sites dropping invalid entries', () => {
    expect(parseSites([site, { bad: true }])).toEqual([site]);
    expect(parseSites(undefined)).toEqual([]);
  });

  it('parses settings field by field with defaults', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.useBrowserThemeColors).toBe(true);
    expect(parseSettings({ useBrowserThemeColors: false }).useBrowserThemeColors).toBe(false);
    expect(parseSettings({ useBrowserThemeColors: 'no' }).useBrowserThemeColors).toBe(true);
    expect(parseSettings({ navigationMode: 'top-bar', topBarDisplay: 'nope' })).toEqual({
      ...DEFAULT_SETTINGS,
      navigationMode: 'top-bar',
    });
    expect(parseSettings({ persistence: 'configured-url' }).persistence).toBe('configured-url');
  });

  it('falls back for notes and panel state', () => {
    expect(parseNotes(null)).toBe(DEFAULT_NOTES);
    expect(parseNotes({ markdown: 'x', updatedAt: 2 })).toEqual({ markdown: 'x', updatedAt: 2 });
    expect(parsePanelState(undefined)).toEqual(defaultPanelState());
    const state = { activeItemId: 'a', urlBySiteId: {} };
    expect(parsePanelState(state)).toBe(state);
  });
});
