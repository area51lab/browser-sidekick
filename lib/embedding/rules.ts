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
  return parsed.hostname || null;
}

export function originPattern(url: string): string | null {
  const host = siteHost(url);
  if (!host) return null;
  return `${new URL(url).protocol}//${host}/*`;
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

export function uniqueSiteHosts(sites: readonly EmbeddableSite[]): string[] {
  const hosts = new Set<string>();
  for (const site of sites) {
    const host = siteHost(site.url);
    if (host) hosts.add(host.toLowerCase());
  }
  return [...hosts].sort();
}

/**
 * Builds one rule per unique site host. Each rule only touches sub_frame
 * requests to that host that were initiated by the extension itself.
 * Dynamic rules cannot edit a header value, so the whole
 * Content-Security-Policy header is removed rather than only its
 * frame-ancestors directive.
 */
export function buildEmbeddingRules(
  sites: readonly EmbeddableSite[],
  extensionHost: string,
): EmbeddingRule[] {
  const hosts = uniqueSiteHosts(sites);
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
