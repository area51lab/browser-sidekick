import type { Settings, Site, TabState } from './types';

export type NewSite = Omit<Site, 'id' | 'createdAt'>;
export type SitePatch = Partial<Omit<Site, 'id' | 'createdAt'>>;

export const createSite = (
  input: NewSite,
  id: string = crypto.randomUUID(),
  createdAt: number = Date.now(),
): Site => ({ ...input, id, createdAt });

export const addSite = (sites: Site[], site: Site): Site[] => [...sites, site];

export const updateSite = (sites: Site[], id: string, patch: SitePatch): Site[] =>
  sites.map((site) => (site.id === id ? { ...site, ...patch } : site));

export const removeSite = (sites: Site[], id: string): Site[] =>
  sites.filter((site) => site.id !== id);

export function reorderSites(sites: Site[], id: string, toIndex: number): Site[] {
  const moved = sites.find((site) => site.id === id);
  if (!moved) return sites;
  const next = removeSite(sites, id);
  next.splice(Math.min(Math.max(toIndex, 0), next.length), 0, moved);
  return next;
}

export const displayName = (site: Site): string => site.customName?.trim() || site.title;

export function resolveInitialUrl(
  site: Site,
  settings: Settings,
  tabState?: TabState | null,
): string {
  if (settings.persistence === 'configured-url') return site.url;
  return tabState?.urlBySiteId[site.id] ?? site.url;
}
