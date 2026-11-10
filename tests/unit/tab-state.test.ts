import { describe, expect, it } from 'vitest';
import { defaultTabState, withActiveItem, withSiteUrl } from '../../lib/storage';

describe('tab state reducers', () => {
  const base = defaultTabState(1);

  it('sets the active item and keeps identity when unchanged', () => {
    const next = withActiveItem(base, 'a');
    expect(next).toEqual({ ...base, activeItemId: 'a' });
    expect(withActiveItem(next, 'a')).toBe(next);
  });

  it('records a site url without touching other sites', () => {
    const first = withSiteUrl(base, 'a', 'https://a.test/1');
    const second = withSiteUrl(first, 'b', 'https://b.test/');
    expect(second.urlBySiteId).toEqual({ a: 'https://a.test/1', b: 'https://b.test/' });
    expect(first.urlBySiteId).toEqual({ a: 'https://a.test/1' });
  });

  it('keeps identity when the url is unchanged', () => {
    const state = withSiteUrl(base, 'a', 'https://a.test/');
    expect(withSiteUrl(state, 'a', 'https://a.test/')).toBe(state);
  });
});
