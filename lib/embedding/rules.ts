export interface EmbeddableSite {
  url: string;
}

export type EmbeddingRule = chrome.declarativeNetRequest.Rule;

const RULE_ID_SPACE = 2_147_483_646;
const STRIPPED_RESPONSE_HEADERS = ['x-frame-options', 'content-security-policy'];

export function siteHost(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return parsed.hostname;
}

const TWO_LEVEL_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.br',
  'net.br',
  'org.br',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'co.jp',
  'co.in',
  'co.za',
  'com.mx',
  'com.ar',
  'com.tr',
  'com.cn',
]);

function isExactHost(host: string): boolean {
  return host.startsWith('[') || !host.includes('.') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/**
 * Heuristic registrable domain, without a public suffix list: the last two
 * labels, or the last three when the last two are a known two-level suffix
 * (co.uk, com.br...). IPs, IPv6 literals and single-label hosts such as
 * localhost are returned unchanged.
 */
export function parentDomain(host: string): string {
  const lower = host.toLowerCase();
  if (isExactHost(lower)) return lower;
  const labels = lower.split('.');
  const keep = TWO_LEVEL_SUFFIXES.has(labels.slice(-2).join('.')) ? 3 : 2;
  return labels.slice(-keep).join('.');
}

/**
 * Match patterns covering the site's parent domain and all its subdomains,
 * so cross-subdomain redirects (mail.proton.me to account.proton.me) stay
 * covered. Exact hosts (IPs, localhost) only get their own pattern.
 */
export function permissionPatterns(url: string): string[] | null {
  const host = siteHost(url);
  if (!host) return null;
  const domain = parentDomain(host);
  if (isExactHost(domain)) return [`*://${domain}/*`];
  return [`*://*.${domain}/*`, `*://${domain}/*`];
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Derives a rule id from the host so the same host keeps the same id across
 * list changes. Hosts are processed in sorted order and collisions probe
 * linearly, which keeps the mapping deterministic for a given host set.
 */
function assignRuleIds(hosts: readonly string[]): Map<string, number> {
  const ids = new Map<string, number>();
  const taken = new Set<number>();
  for (const host of hosts) {
    let id = (fnv1a(host) % RULE_ID_SPACE) + 1;
    while (taken.has(id)) id = (id % RULE_ID_SPACE) + 1;
    taken.add(id);
    ids.set(host, id);
  }
  return ids;
}

export function uniqueSiteDomains(sites: readonly EmbeddableSite[]): string[] {
  const hosts = new Set<string>();
  for (const site of sites) {
    const host = siteHost(site.url);
    if (host) hosts.add(parentDomain(host));
  }
  return [...hosts].sort();
}

/**
 * Builds one rule per unique parent domain (subdomains included, so
 * redirects between subdomains stay covered). Each rule only touches
 * sub_frame requests to that domain that were initiated by the extension itself.
 * Dynamic rules cannot edit a header value, so the whole
 * Content-Security-Policy header is removed rather than only its
 * frame-ancestors directive.
 */
export function buildEmbeddingRules(
  sites: readonly EmbeddableSite[],
  extensionHost: string,
): EmbeddingRule[] {
  const hosts = uniqueSiteDomains(sites);
  const ids = assignRuleIds(hosts);
  return hosts.map((host) => ({
    id: ids.get(host)!,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: STRIPPED_RESPONSE_HEADERS.map((header) => ({
        header,
        operation: 'remove',
      })),
    },
    condition: {
      requestDomains: [host],
      initiatorDomains: [extensionHost],
      resourceTypes: ['sub_frame'],
    },
  })) as EmbeddingRule[];
}
