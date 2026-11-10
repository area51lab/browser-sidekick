import { describe, expect, it } from 'vitest';
import { NOTES_ITEM, buildNavItems, resolveActiveId } from '../../components/nav/items';
import { NOTES_ID } from '../../components/nav/types';
import type { Site } from '../../lib/storage';

const a: Site = {
  id: 'a',
  url: 'https://a.test',
  title: 'Alpha',
  faviconUrl: 'a.png',
  createdAt: 1,
};
const b: Site = {
  id: 'b',
  url: 'https://b.test',
  title: 'Beta',
  customName: ' Bee ',
  createdAt: 2,
};

describe('buildNavItems', () => {
  it('maps sites in order and pins notes last', () => {
    expect(buildNavItems([a, b])).toEqual([
      { id: 'a', kind: 'site', label: 'Alpha', iconUrl: 'a.png' },
      { id: 'b', kind: 'site', label: 'Bee', iconUrl: undefined },
      NOTES_ITEM,
    ]);
  });

  it('always contains notes', () => {
    expect(buildNavItems([])).toEqual([NOTES_ITEM]);
  });
});

describe('resolveActiveId', () => {
  const items = buildNavItems([a, b]);

  it('keeps a stored site or notes', () => {
    expect(resolveActiveId(items, 'b')).toBe('b');
    expect(resolveActiveId(items, NOTES_ID)).toBe(NOTES_ID);
  });

  it('falls back to the first site when the stored id is unknown or empty', () => {
    expect(resolveActiveId(items, '')).toBe('a');
    expect(resolveActiveId(items, 'gone')).toBe('a');
  });

  it('returns null when there are no sites and notes was not chosen', () => {
    expect(resolveActiveId(buildNavItems([]), '')).toBeNull();
    expect(resolveActiveId(buildNavItems([]), NOTES_ID)).toBe(NOTES_ID);
  });
});
