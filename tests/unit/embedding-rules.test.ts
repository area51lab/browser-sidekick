import { describe, expect, it } from 'vitest';
import {
  buildEmbeddingRules,
  originPattern,
  siteHost,
  uniqueSiteHosts,
} from '../../lib/embedding/rules';

const EXT = 'abcdefghijklmnop';

describe('siteHost', () => {
  it('extracts the lowercase hostname without port, path or credentials', () => {
    expect(siteHost('https://User:pw@Example.COM:8080/a?b#c')).toBe('example.com');
  });

  it('rejects invalid and non http(s) urls', () => {
    expect(siteHost('not a url')).toBeNull();
    expect(siteHost('chrome://settings')).toBeNull();
    expect(siteHost('javascript:alert(1)')).toBeNull();
    expect(siteHost('file:///tmp/a')).toBeNull();
  });

  it('converts internationalized hosts to punycode', () => {
    expect(siteHost('https://bücher.example/')).toBe('xn--bcher-kva.example');
  });
});

describe('originPattern', () => {
  it('builds a match pattern for the origin', () => {
    expect(originPattern('https://example.com:8080/a/b')).toBe('https://example.com/*');
    expect(originPattern('http://example.com')).toBe('http://example.com/*');
  });

  it('returns null for unsupported urls', () => {
    expect(originPattern('ftp://example.com')).toBeNull();
    expect(originPattern('nope')).toBeNull();
  });
});

describe('uniqueSiteHosts', () => {
  it('dedupes by host, ignoring case, paths and ports, and sorts', () => {
    expect(
      uniqueSiteHosts([
        { url: 'https://b.com/x' },
        { url: 'https://A.com' },
        { url: 'http://a.com:81/y' },
        { url: 'bad' },
      ]),
    ).toEqual(['a.com', 'b.com']);
  });
});

describe('buildEmbeddingRules', () => {
  const sites = [{ url: 'https://a.com/x' }, { url: 'https://b.com' }, { url: 'https://a.com/y' }];

  it('returns no rules for no valid sites', () => {
    expect(buildEmbeddingRules([], EXT)).toEqual([]);
    expect(buildEmbeddingRules([{ url: 'bad' }], EXT)).toEqual([]);
  });

  it('creates one rule per unique host', () => {
    const rules = buildEmbeddingRules(sites, EXT);
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.condition.requestDomains)).toEqual([['a.com'], ['b.com']]);
  });

  it('scopes every rule to the extension and sub_frame requests', () => {
    for (const rule of buildEmbeddingRules(sites, EXT)) {
      expect(rule.condition.initiatorDomains).toEqual([EXT]);
      expect(rule.condition.resourceTypes).toEqual(['sub_frame']);
      expect(rule.condition.urlFilter).toBeUndefined();
    }
  });

  it('removes X-Frame-Options and Content-Security-Policy response headers', () => {
    const rule = buildEmbeddingRules(sites, EXT)[0]!;
    expect(rule.action.type).toBe('modifyHeaders');
    expect(rule.action.responseHeaders).toEqual([
      { header: 'x-frame-options', operation: 'remove' },
      { header: 'content-security-policy', operation: 'remove' },
    ]);
    expect(rule.action.requestHeaders).toBeUndefined();
  });

  it('produces unique positive integer ids', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ url: `https://site${i}.example` }));
    const ids = buildEmbeddingRules(many, EXT).map((r) => r.id);
    expect(new Set(ids).size).toBe(500);
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThan(0);
      expect(id).toBeLessThanOrEqual(2_147_483_647);
    }
  });

  it('keeps ids stable regardless of order, duplicates and other hosts', () => {
    const idOf = (list: { url: string }[], host: string) =>
      buildEmbeddingRules(list, EXT).find((r) => r.condition.requestDomains?.[0] === host)!.id;
    const base = idOf(sites, 'b.com');
    expect(idOf([...sites].reverse(), 'b.com')).toBe(base);
    expect(idOf([{ url: 'https://b.com' }], 'b.com')).toBe(base);
    expect(buildEmbeddingRules(sites, EXT)).toEqual(buildEmbeddingRules(sites, EXT));
  });

  it('does not let hostile urls inject into the host', () => {
    const rules = buildEmbeddingRules([{ url: 'https://evil.com\\@good.com/*' }], EXT);
    expect(rules.map((r) => r.condition.requestDomains)).toEqual([['evil.com']]);
  });
});
