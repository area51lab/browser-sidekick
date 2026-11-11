import { siteHost } from './rules';

/**
 * Hosts reported to break inside the panel even with framing headers stripped
 * (JavaScript frame busting, cross-origin isolation, sign-in that refuses
 * framing). Headers cannot reveal this, so the list is curated. Entries match
 * the host and its subdomains.
 */
const UNSUPPORTED_HOSTS = ['mail.google.com', 'gmail.com'];

export function isEmbeddingUnsupported(url: string): boolean {
  const host = siteHost(url);
  if (!host) return false;
  return UNSUPPORTED_HOSTS.some((entry) => host === entry || host.endsWith(`.${entry}`));
}
