import {
  DEFAULT_NOTES,
  DEFAULT_SETTINGS,
  NAVIGATION_MODES,
  PERSISTENCE_MODES,
  TOP_BAR_DISPLAYS,
  defaultTabState,
} from './types';
import type { Notes, Settings, Site, TabState } from './types';

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === 'string';

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export function isSite(value: unknown): value is Site {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.url === 'string' &&
    typeof value.title === 'string' &&
    isOptionalString(value.customName) &&
    isOptionalString(value.faviconUrl) &&
    typeof value.createdAt === 'number'
  );
}

export function isNotes(value: unknown): value is Notes {
  return (
    isRecord(value) && typeof value.markdown === 'string' && typeof value.updatedAt === 'number'
  );
}

export function isTabState(value: unknown): value is TabState {
  return (
    isRecord(value) &&
    typeof value.tabId === 'number' &&
    typeof value.activeItemId === 'string' &&
    isRecord(value.urlBySiteId) &&
    Object.values(value.urlBySiteId).every((url) => typeof url === 'string')
  );
}

export const parseSites = (value: unknown): Site[] =>
  Array.isArray(value) ? value.filter(isSite) : [];

export function parseSettings(value: unknown): Settings {
  const raw = isRecord(value) ? value : {};
  return {
    navigationMode: pick(NAVIGATION_MODES, raw.navigationMode, DEFAULT_SETTINGS.navigationMode),
    topBarDisplay: pick(TOP_BAR_DISPLAYS, raw.topBarDisplay, DEFAULT_SETTINGS.topBarDisplay),
    persistence: pick(PERSISTENCE_MODES, raw.persistence, DEFAULT_SETTINGS.persistence),
  };
}

export const parseNotes = (value: unknown): Notes => (isNotes(value) ? value : DEFAULT_NOTES);

export const parseTabState =
  (tabId: number) =>
  (value: unknown): TabState =>
    isTabState(value) ? value : defaultTabState(tabId);
