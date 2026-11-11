import { useCallback, useEffect, useState } from 'preact/hooks';
import type { Entry } from './entry';
import { getStore } from './store';
import type { Store } from './store';
import { DEFAULT_NOTES, DEFAULT_SETTINGS, defaultPanelState } from './types';
import type { Notes, Settings, PanelState, Site } from './types';

export interface StorageState<T> {
  value: T;
  ready: boolean;
  set(value: T): Promise<void>;
  update(change: (current: T) => T): Promise<void>;
}

export function useEntry<T>(entry: Entry<T>, initial: T): StorageState<T> {
  const [state, setState] = useState<{ value: T; ready: boolean }>({
    value: initial,
    ready: false,
  });

  useEffect(() => {
    let active = true;
    setState({ value: initial, ready: false });
    void entry.get().then((value) => active && setState({ value, ready: true }));
    const unsubscribe = entry.subscribe((value) => setState({ value, ready: true }));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [entry]);

  const set = useCallback((value: T) => entry.set(value), [entry]);
  const update = useCallback((change: (current: T) => T) => entry.update(change), [entry]);
  return { ...state, set, update };
}

const EMPTY_SITES: Site[] = [];

export const useSites = (store: Store = getStore()): StorageState<Site[]> =>
  useEntry(store.sites, EMPTY_SITES);

export const useSettings = (store: Store = getStore()): StorageState<Settings> =>
  useEntry(store.settings, DEFAULT_SETTINGS);

export const useNotes = (store: Store = getStore()): StorageState<Notes> =>
  useEntry(store.notes, DEFAULT_NOTES);

const DEFAULT_PANEL_STATE = defaultPanelState();

export const usePanelState = (store: Store = getStore()): StorageState<PanelState> =>
  useEntry(store.panelState, DEFAULT_PANEL_STATE);
