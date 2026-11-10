import { createBrowserAdapter } from './adapter';
import type { StorageAdapter } from './adapter';
import { createEntry } from './entry';
import type { Entry } from './entry';
import { parseNotes, parseSettings, parseSites, parseTabState } from './guards';
import { migrate } from './schema';
import type { Migration } from './schema';
import type { Notes, Settings, Site, TabState } from './types';

export const TAB_KEY_PREFIX = 'tab:';
export const tabKey = (tabId: number): string => `${TAB_KEY_PREFIX}${tabId}`;

export interface Store {
  ready: Promise<void>;
  sites: Entry<Site[]>;
  settings: Entry<Settings>;
  notes: Entry<Notes>;
  tabState(tabId: number): Entry<TabState>;
  removeTabState(tabId: number): Promise<void>;
}

export interface StoreOptions {
  local: StorageAdapter;
  session: StorageAdapter;
  migrations?: Record<number, Migration>;
  schemaVersion?: number;
}

export function createStore({ local, session, migrations, schemaVersion }: StoreOptions): Store {
  const ready = migrate(local, migrations, schemaVersion);
  return {
    ready,
    sites: createEntry(local, 'sites', parseSites, ready),
    settings: createEntry(local, 'settings', parseSettings, ready),
    notes: createEntry(local, 'notes', parseNotes, ready),
    tabState: (tabId) => createEntry(session, tabKey(tabId), parseTabState(tabId)),
    removeTabState: (tabId) => session.remove([tabKey(tabId)]),
  };
}

let defaultStore: Store | undefined;

export function getStore(): Store {
  defaultStore ??= createStore({
    local: createBrowserAdapter('local'),
    session: createBrowserAdapter('session'),
  });
  return defaultStore;
}

export function registerTabCleanup(
  onRemoved: { addListener(listener: (tabId: number) => void): void },
  store: Store = getStore(),
): void {
  onRemoved.addListener((tabId) => void store.removeTabState(tabId));
}
