export type MetadataError = 'invalid-url' | 'network' | 'http' | 'timeout';

export interface SiteMetadata {
  title: string;
  faviconUrl: string;
  error?: MetadataError;
}

export interface FetchMetadataOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_HTML_LENGTH = 512 * 1024;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:(?!\d+(\/|$))/i;
const UNSIZED_ICON_SCORE = 32;
const SCALABLE_ICON_SCORE = 512;
const APPLE_TOUCH_ICON_SCORE = 180;

/**
 * Returns the canonical http(s) URL for user input, adding https:// when no scheme is given,
 * or null when the input is empty, malformed or uses another scheme.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

const fallbackIconUrl = (pageUrl: string): string => new URL('/favicon.ico', pageUrl).href;

function iconScore(link: Element): number {
  const rel = (link.getAttribute('rel') ?? '').toLowerCase().split(/\s+/);
  const sizes = (link.getAttribute('sizes') ?? '').toLowerCase();
  const apple = rel.some((token) => token.startsWith('apple-touch-icon'));
  const fromSizes = sizes
    .split(/\s+/)
    .map((size) => (size === 'any' ? SCALABLE_ICON_SCORE : Number.parseInt(size, 10)))
    .filter((value) => Number.isFinite(value));
  const declared = fromSizes.length ? Math.max(...fromSizes) : 0;
  const base = declared || (apple ? APPLE_TOUCH_ICON_SCORE : UNSIZED_ICON_SCORE);
  return apple ? base + 0.5 : base;
}

function pickIcon(doc: Document, baseUrl: string): string | null {
  const candidates = [
    ...doc.querySelectorAll('link[rel~="icon" i], link[rel^="apple-touch-icon" i]'),
  ]
    .map((link) => {
      const href = link.getAttribute('href')?.trim();
      if (!href) return null;
      try {
        const resolved = new URL(href, baseUrl);
        const web = resolved.protocol === 'http:' || resolved.protocol === 'https:';
        return web ? { href: resolved.href, score: iconScore(link) } : null;
      } catch {
        return null;
      }
    })
    .filter((candidate): candidate is { href: string; score: number } => candidate !== null);
  const best = candidates.reduce<{ href: string; score: number } | null>(
    (top, candidate) => (!top || candidate.score > top.score ? candidate : top),
    null,
  );
  return best?.href ?? null;
}

const clean = (value: string | null | undefined): string =>
  value?.replace(/\s+/g, ' ').trim() ?? '';

/** Extracts the display title and best favicon from an HTML document. Never throws. */
export function parseSiteMetadata(html: string, pageUrl: string): SiteMetadata {
  const doc = new DOMParser().parseFromString(html.slice(0, MAX_HTML_LENGTH), 'text/html');
  const siteName = clean(
    doc
      .querySelector('meta[property="og:site_name" i], meta[name="og:site_name" i]')
      ?.getAttribute('content'),
  );
  const title =
    siteName || clean(doc.querySelector('title')?.textContent) || new URL(pageUrl).hostname;
  return { title, faviconUrl: pickIcon(doc, pageUrl) ?? fallbackIconUrl(pageUrl) };
}

const isHtml = (response: Response): boolean => {
  const type = response.headers.get('content-type');
  return !type || /html|xml/i.test(type);
};

/**
 * Fetches a page and derives its title and favicon without third-party services.
 * Always resolves: failures yield the hostname as title and `/favicon.ico` as icon, with `error` set.
 */
export async function fetchSiteMetadata(
  input: string,
  options: FetchMetadataOptions = {},
): Promise<SiteMetadata> {
  const url = normalizeUrl(input);
  if (!url) return { title: '', faviconUrl: '', error: 'invalid-url' };

  const fallback: SiteMetadata = { title: new URL(url).hostname, faviconUrl: fallbackIconUrl(url) };
  const doFetch = options.fetch ?? globalThis.fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await doFetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      redirect: 'follow',
    });
    if (!response.ok) return { ...fallback, error: 'http' };
    if (!isHtml(response)) return fallback;
    const finalUrl = normalizeUrl(response.url) ?? url;
    return parseSiteMetadata(await response.text(), finalUrl);
  } catch {
    return { ...fallback, error: controller.signal.aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
