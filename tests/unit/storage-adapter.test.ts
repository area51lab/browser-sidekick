import { beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (changes: Record<string, { newValue?: unknown }>, area: string) => void;

const hoisted = vi.hoisted(() => {
  const listeners = new Set<unknown>();
  const area = () => ({
    data: {} as Record<string, unknown>,
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  });
  return { listeners, local: area(), session: area() };
});

vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: hoisted.local,
      session: hoisted.session,
      onChanged: {
        addListener: (l: unknown) => hoisted.listeners.add(l),
        removeListener: (l: unknown) => hoisted.listeners.delete(l),
      },
    },
  },
}));

import { createBrowserAdapter } from '../../lib/storage/adapter';

describe('browser adapter', () => {
  beforeEach(() => {
    hoisted.listeners.clear();
    hoisted.local.get.mockImplementation(async (key: string | null) =>
      key === null ? { a: 1 } : { [key]: 'v' },
    );
    hoisted.local.set.mockResolvedValue(undefined);
    hoisted.local.remove.mockResolvedValue(undefined);
  });

  it('delegates to the chosen storage area', async () => {
    const adapter = createBrowserAdapter('local');
    expect(await adapter.get('k')).toBe('v');
    expect(await adapter.getAll()).toEqual({ a: 1 });
    await adapter.set('k', 2);
    await adapter.remove(['k']);
    expect(hoisted.local.set).toHaveBeenCalledWith({ k: 2 });
    expect(hoisted.local.remove).toHaveBeenCalledWith(['k']);
  });

  it('forwards only changes from its own area and unsubscribes', () => {
    const adapter = createBrowserAdapter('session');
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);
    const registered = [...hoisted.listeners][0] as Listener;

    registered({ k: { newValue: 1 }, gone: {} }, 'session');
    registered({ k: { newValue: 2 } }, 'local');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ k: 1, gone: undefined });

    unsubscribe();
    expect(hoisted.listeners.size).toBe(0);
  });
});
