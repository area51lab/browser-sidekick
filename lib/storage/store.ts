import { createBrowserAdapter } from './adapter';
import type { StorageAdapter } from './adapter';
import { createEntry } from './entry';
import type { Entry } from './entry';
import { parseNotes, parseSettings, parsePanelState, parseSites } from './guards';
import { migrate } from './schema';
import type { Migration } from './schema';
import type { Notes, PanelState, Settings, Site } from './types';

export interface Store {
  ready: Promise<void>;
  sites: Entry<Site[]>;
  settings: Entry<Settings>;
  notes: Entry<Notes>;
  /** Session-scoped, shared by the whole panel regardless of the active browser tab. */
  panelState: Entry<PanelState>;
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
    panelState: createEntry(session, 'panel', parsePanelState),
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
