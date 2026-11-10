import { describe, expect, it } from 'vitest';
import {
  addSite,
  createSite,
  displayName,
  removeSite,
  reorderSites,
  resolveInitialUrl,
  updateSite,
} from '../../lib/storage/sites';
import { DEFAULT_SETTINGS } from '../../lib/storage/types';
import type { Site } from '../../lib/storage/types';

const make = (id: string, extra: Partial<Site> = {}): Site => ({
  id,
  url: `https://${id}.test`,
  title: id.toUpperCase(),
  createdAt: 1,
  ...extra,
});
const [a, b, c] = [make('a'), make('b'), make('c')];

describe('site helpers', () => {
  it('creates sites with provided or generated identity', () => {
    expect(createSite({ url: 'u', title: 't' }, 'id', 5)).toEqual({
      url: 'u',
      title: 't',
      id: 'id',
      createdAt: 5,
    });
    const generated = createSite({ url: 'u', title: 't' });
    expect(generated.id).toMatch(/[0-9a-f-]{36}/);
    expect(typeof generated.createdAt).toBe('number');
  });

  it('adds, updates and removes without mutating', () => {
    const list = [a];
    expect(addSite(list, b)).toEqual([a, b]);
    expect(list).toEqual([a]);
    expect(updateSite([a, b], 'b', { customName: 'Bee' })[1]?.customName).toBe('Bee');
    expect(updateSite([a, b], 'zzz', { title: 'x' })).toEqual([a, b]);
    expect(removeSite([a, b], 'a')).toEqual([b]);
  });

  it('reorders by id and clamps the target index', () => {
    expect(reorderSites([a, b, c], 'a', 2).map((s) => s.id)).toEqual(['b', 'c', 'a']);
    expect(reorderSites([a, b, c], 'c', 0).map((s) => s.id)).toEqual(['c', 'a', 'b']);
    expect(reorderSites([a, b, c], 'a', 99).map((s) => s.id)).toEqual(['b', 'c', 'a']);
    expect(reorderSites([a, b, c], 'c', -5).map((s) => s.id)).toEqual(['c', 'a', 'b']);
    const same = [a, b];
    expect(reorderSites(same, 'missing', 0)).toBe(same);
  });

  it('prefers the custom name for display', () => {
    expect(displayName(a)).toBe('A');
    expect(displayName(make('a', { customName: '  Mine ' }))).toBe('Mine');
    expect(displayName(make('a', { customName: '   ' }))).toBe('A');
  });

  it('resolves the initial URL from settings and tab state', () => {
    const tab = { tabId: 1, activeItemId: 'a', urlBySiteId: { a: 'https://a.test/deep' } };
    expect(resolveInitialUrl(a, DEFAULT_SETTINGS, tab)).toBe('https://a.test/deep');
    expect(resolveInitialUrl(b, DEFAULT_SETTINGS, tab)).toBe('https://b.test');
    expect(resolveInitialUrl(a, DEFAULT_SETTINGS)).toBe('https://a.test');
    expect(resolveInitialUrl(a, DEFAULT_SETTINGS, null)).toBe('https://a.test');
    expect(resolveInitialUrl(a, { ...DEFAULT_SETTINGS, persistence: 'configured-url' }, tab)).toBe(
      'https://a.test',
    );
  });
});
