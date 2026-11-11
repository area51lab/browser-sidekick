import { describe, expect, it, vi } from 'vitest';
import { createEntry } from '../../lib/storage/entry';
import { createStore } from '../../lib/storage/store';
import { DEFAULT_NOTES, DEFAULT_SETTINGS, defaultPanelState } from '../../lib/storage/types';
import { createFakeAdapter } from '../helpers/fakeStorage';

const setup = (local = createFakeAdapter(), session = createFakeAdapter()) => ({
  local,
  session,
  store: createStore({ local, session }),
});

const site = { id: 'a', url: 'https://a.test', title: 'A', createdAt: 1 };

describe('store', () => {
  it('returns defaults when empty and stamps the schema version', async () => {
    const { store, local } = setup();
    expect(await store.sites.get()).toEqual([]);
    expect(await store.settings.get()).toEqual(DEFAULT_SETTINGS);
    expect(await store.notes.get()).toEqual(DEFAULT_NOTES);
    expect(local.data.schemaVersion).toBe(1);
  });

  it('persists sites, settings and notes in local and panel state in session', async () => {
    const { store, local, session } = setup();
    await store.sites.set([site]);
    await store.settings.update((s) => ({ ...s, navigationMode: 'top-bar' }));
    await store.notes.set({ markdown: '# hi', updatedAt: 3 });
    await store.panelState.update((t) => ({ ...t, activeItemId: 'a' }));

    expect(local.data.sites).toEqual([site]);
    expect((local.data.settings as { navigationMode: string }).navigationMode).toBe('top-bar');
    expect(local.data.notes).toEqual({ markdown: '# hi', updatedAt: 3 });
    expect(session.data.panel).toEqual({ ...defaultPanelState(), activeItemId: 'a' });
    expect(local.data.panel).toBeUndefined();
  });

  it('serialises concurrent updates', async () => {
    const { store } = setup();
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        store.sites.update((sites) => [...sites, { ...site, id: String(i) }]),
      ),
    );
    expect(await store.sites.get()).toHaveLength(10);
  });

  it('keeps the queue alive after a failing update', async () => {
    const { store } = setup();
    await expect(
      store.sites.update(() => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    await store.sites.set([site]);
    expect(await store.sites.get()).toEqual([site]);
  });

  it('removes entries and notifies subscribers', async () => {
    const { store } = setup();
    const listener = vi.fn();
    const unsubscribe = store.sites.subscribe(listener);
    await store.sites.set([site]);
    await store.sites.remove();
    unsubscribe();
    await store.sites.set([site]);
    expect(listener).toHaveBeenNthCalledWith(1, [site]);
    expect(listener).toHaveBeenNthCalledWith(2, []);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('ignores changes to other keys', async () => {
    const local = createFakeAdapter();
    const entry = createEntry(local, 'a', (raw) => raw);
    const listener = vi.fn();
    entry.subscribe(listener);
    await local.set('b', 1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('runs custom migrations before reads', async () => {
    const local = createFakeAdapter({ schemaVersion: 1, sites: 'legacy' });
    const store = createStore({
      local,
      session: createFakeAdapter(),
      schemaVersion: 2,
      migrations: { 1: (s) => ({ ...s, sites: [site] }) },
    });
    expect(await store.sites.get()).toEqual([site]);
  });
});
