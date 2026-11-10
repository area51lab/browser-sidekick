import type { ChangeListener, StorageAdapter } from '../../lib/storage/adapter';

export interface FakeAdapter extends StorageAdapter {
  data: Record<string, unknown>;
}

export function createFakeAdapter(initial: Record<string, unknown> = {}): FakeAdapter {
  const data: Record<string, unknown> = { ...initial };
  const listeners = new Set<ChangeListener>();
  const emit = (changes: Record<string, unknown>) =>
    [...listeners].forEach((listener) => listener(changes));

  return {
    data,
    get: async (key) => data[key],
    getAll: async () => ({ ...data }),
    async set(key, value) {
      data[key] = value;
      emit({ [key]: value });
    },
    async remove(keys) {
      keys.forEach((key) => delete data[key]);
      emit(Object.fromEntries(keys.map((key) => [key, undefined])));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
