import { browser } from 'wxt/browser';

export type ChangeListener = (changes: Record<string, unknown>) => void;

export interface StorageAdapter {
  get(key: string): Promise<unknown>;
  getAll(): Promise<Record<string, unknown>>;
  set(key: string, value: unknown): Promise<void>;
  remove(keys: string[]): Promise<void>;
  subscribe(listener: ChangeListener): () => void;
}

type AreaName = 'local' | 'session';

export function createBrowserAdapter(areaName: AreaName): StorageAdapter {
  const area = browser.storage[areaName];
  return {
    async get(key) {
      const result = await area.get(key);
      return result[key];
    },
    getAll: () => area.get(null),
    set: (key, value) => area.set({ [key]: value }),
    remove: (keys) => area.remove(keys),
    subscribe(listener) {
      const onChanged = (changes: Record<string, { newValue?: unknown }>, changedArea: string) => {
        if (changedArea !== areaName) return;
        listener(Object.fromEntries(Object.entries(changes).map(([k, c]) => [k, c.newValue])));
      };
      browser.storage.onChanged.addListener(onChanged);
      return () => browser.storage.onChanged.removeListener(onChanged);
    },
  };
}
