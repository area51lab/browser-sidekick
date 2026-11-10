import type { Site } from '../storage';

export interface FrameNavigation {
  frameId: number;
  url: string;
}

const hostnameOf = (url: string): string | undefined => {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
};

const sameSiteHost = (a: string, b: string): boolean =>
  a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);

export const trackableUrl = (url: string): boolean => /^https?:\/\//.test(url);

export function findSiteByHost(sites: Site[], url: string): Site | undefined {
  const host = hostnameOf(url);
  if (!host) return undefined;
  return sites.find((site) => {
    const siteHost = hostnameOf(site.url);
    return siteHost !== undefined && sameSiteHost(host, siteHost);
  });
}

/**
 * Cross-origin iframes hide their location, so navigation events only carry a frame id and a URL.
 * The first event of a frame is matched to a site by host and the frame keeps that site afterwards,
 * which keeps tracking correct when the site redirects to another host (for example a login page).
 */
export function createFrameAttribution() {
  const siteByFrame = new Map<number, string>();
  return (sites: Site[], { frameId, url }: FrameNavigation): string | undefined => {
    if (!trackableUrl(url)) return undefined;
    const known = siteByFrame.get(frameId);
    if (known && sites.some((site) => site.id === known)) return known;
    const match = findSiteByHost(sites, url);
    if (match) siteByFrame.set(frameId, match.id);
    else siteByFrame.delete(frameId);
    return match?.id;
  };
}
