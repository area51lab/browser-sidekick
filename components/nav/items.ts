import { displayName } from '../../lib/storage';
import type { Site } from '../../lib/storage';
import { NOTES_ID } from './types';
import type { NavItem } from './types';

export const NOTES_ITEM: NavItem = { id: NOTES_ID, kind: 'notes', label: 'Notes' };

export const buildNavItems = (sites: Site[]): NavItem[] => [
  ...sites.map((site): NavItem => ({
    id: site.id,
    kind: 'site',
    label: displayName(site),
    iconUrl: site.faviconUrl,
  })),
  NOTES_ITEM,
];

/**
 * Returns the stored item when it still exists, otherwise the first site.
 * Returns null when there is nothing to show (no sites and Notes not chosen).
 */
export function resolveActiveId(items: NavItem[], storedId: string): string | null {
  if (items.some((item) => item.id === storedId)) return storedId;
  return items.find((item) => item.kind === 'site')?.id ?? null;
}
