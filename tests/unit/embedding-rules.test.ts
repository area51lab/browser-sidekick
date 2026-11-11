import { describe, expect, it } from 'vitest';
import {
  buildEmbeddingRules,
  parentDomain,
  permissionPatterns,
  siteHost,
  uniqueSiteDomains,
} from '../../lib/embedding/rules';
import { isEmbeddingUnsupported } from '../../lib/embedding/unsupported';

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

describe('parentDomain', () => {
  it('keeps the last two labels', () => {
    expect(parentDomain('mail.proton.me')).toBe('proton.me');
    expect(parentDomain('a.b.Example.com')).toBe('example.com');
    expect(parentDomain('example.com')).toBe('example.com');
  });

  it('keeps three labels for common two-level suffixes', () => {
    expect(parentDomain('www.bbc.co.uk')).toBe('bbc.co.uk');
    expect(parentDomain('app.empresa.com.br')).toBe('empresa.com.br');
    expect(parentDomain('x.y.com.au')).toBe('y.com.au');
  });

  it('leaves IPs, IPv6 and single-label hosts exact', () => {
    expect(parentDomain('192.168.0.10')).toBe('192.168.0.10');
    expect(parentDomain('localhost')).toBe('localhost');
    expect(parentDomain('[::1]')).toBe('[::1]');
  });
});

describe('permissionPatterns', () => {
  it('covers the parent domain and its subdomains', () => {
    expect(permissionPatterns('https://mail.proton.me:8080/a')).toEqual([
      '*://*.proton.me/*',
      '*://proton.me/*',
    ]);
  });

  it('keeps exact hosts exact', () => {
    expect(permissionPatterns('http://localhost:3000')).toEqual(['*://localhost/*']);
    expect(permissionPatterns('http://127.0.0.1/')).toEqual(['*://127.0.0.1/*']);
  });

  it('returns null for unsupported urls', () => {
    expect(permissionPatterns('ftp://example.com')).toBeNull();
    expect(permissionPatterns('nope')).toBeNull();
  });
});

describe('uniqueSiteDomains', () => {
  it('dedupes by parent domain, ignoring case, paths and ports, and sorts', () => {
    expect(
      uniqueSiteDomains([
        { url: 'https://b.com/x' },
        { url: 'https://A.com' },
        { url: 'http://mail.a.com:81/y' },
        { url: 'bad' },
      ]),
    ).toEqual(['a.com', 'b.com']);
  });
});

describe('buildEmbeddingRules', () => {
  it('scopes proton-like redirects to the parent domain', () => {
    const rules = buildEmbeddingRules([{ url: 'https://mail.proton.me' }], EXT);
    expect(rules.map((r) => r.condition.requestDomains)).toEqual([['proton.me']]);
  });

  const sites = [
    { url: 'https://a.com/x' },
    { url: 'https://b.com' },
    { url: 'https://mail.a.com/y' },
  ];

  it('returns no rules for no valid sites', () => {
    expect(buildEmbeddingRules([], EXT)).toEqual([]);
    expect(buildEmbeddingRules([{ url: 'bad' }], EXT)).toEqual([]);
  });

  it('creates one rule per unique parent domain', () => {
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

describe('isEmbeddingUnsupported', () => {
  it('flags known unembeddable hosts and their subdomains', () => {
    expect(isEmbeddingUnsupported('https://mail.google.com/mail/u/0/')).toBe(true);
    expect(isEmbeddingUnsupported('https://www.gmail.com')).toBe(true);
  });

  it('allows other hosts, including look-alikes', () => {
    expect(isEmbeddingUnsupported('https://google.com')).toBe(false);
    expect(isEmbeddingUnsupported('https://notgmail.com')).toBe(false);
    expect(isEmbeddingUnsupported('nope')).toBe(false);
  });
});
