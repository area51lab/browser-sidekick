import { describe, expect, it } from 'vitest';
import {
  createFrameAttribution,
  findSiteByHost,
  trackableUrl,
} from '../../lib/navigation/attribution';
import type { Site } from '../../lib/storage';

const site = (id: string, url: string): Site => ({ id, url, title: id, createdAt: 1 });
const sites = [site('a', 'https://a.test/'), site('b', 'https://www.b.test/home')];

describe('trackableUrl', () => {
  it('accepts http(s) only', () => {
    expect(trackableUrl('https://a.test')).toBe(true);
    expect(trackableUrl('http://a.test')).toBe(true);
    expect(trackableUrl('about:blank')).toBe(false);
    expect(trackableUrl('chrome-extension://x/')).toBe(false);
  });
});

describe('findSiteByHost', () => {
  it('matches equal hosts and subdomains in both directions', () => {
    expect(findSiteByHost(sites, 'https://a.test/x')?.id).toBe('a');
    expect(findSiteByHost(sites, 'https://app.a.test/x')?.id).toBe('a');
    expect(findSiteByHost(sites, 'https://b.test/x')?.id).toBe('b');
  });

  it('ignores unrelated hosts, similar suffixes and invalid urls', () => {
    expect(findSiteByHost(sites, 'https://other.test/')).toBeUndefined();
    expect(findSiteByHost(sites, 'https://xa.test/')).toBeUndefined();
    expect(findSiteByHost(sites, 'not a url')).toBeUndefined();
    expect(findSiteByHost([site('x', 'nope')], 'https://a.test/')).toBeUndefined();
  });
});

describe('createFrameAttribution', () => {
  it('attributes by host and keeps the frame bound across a redirect to another host', () => {
    const attribute = createFrameAttribution();
    expect(attribute(sites, { frameId: 3, url: 'https://a.test/' })).toBe('a');
    expect(attribute(sites, { frameId: 3, url: 'https://login.other.test/' })).toBe('a');
  });

  it('forgets a frame whose site was removed and rematches', () => {
    const attribute = createFrameAttribution();
    attribute(sites, { frameId: 3, url: 'https://a.test/' });
    expect(attribute([sites[1]!], { frameId: 3, url: 'https://b.test/' })).toBe('b');
  });

  it('returns undefined for unmatched hosts and non http urls', () => {
    const attribute = createFrameAttribution();
    expect(attribute(sites, { frameId: 4, url: 'https://other.test/' })).toBeUndefined();
    expect(attribute(sites, { frameId: 4, url: 'about:blank' })).toBeUndefined();
  });
});
