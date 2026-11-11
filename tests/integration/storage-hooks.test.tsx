import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useNotes, useSettings, usePanelState, useSites } from '../../lib/storage/hooks';
import type { StorageState } from '../../lib/storage/hooks';
import { createStore } from '../../lib/storage/store';
import { DEFAULT_SETTINGS } from '../../lib/storage/types';
import { createFakeAdapter } from '../helpers/fakeStorage';

const site = { id: 'a', url: 'https://a.test', title: 'A', createdAt: 1 };

function mountHook<T>(hook: () => StorageState<T>) {
  const host = document.createElement('div');
  const ref = { current: undefined as unknown as StorageState<T> };
  const Probe = () => {
    ref.current = hook();
    return null;
  };
  act(() => render(<Probe />, host));
  return { ref, unmount: () => act(() => render(null, host)) };
}

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe('storage hooks', () => {
  const mounted: Array<() => void> = [];
  afterEach(() => mounted.splice(0).forEach((unmount) => unmount()));

  const track = <T,>(hook: () => StorageState<T>) => {
    const result = mountHook(hook);
    mounted.push(result.unmount);
    return result.ref;
  };

  it('starts with defaults, then loads stored values', async () => {
    const local = createFakeAdapter({ schemaVersion: 1, sites: [site] });
    const store = createStore({ local, session: createFakeAdapter() });
    const sites = track(() => useSites(store));
    const settings = track(() => useSettings(store));
    expect(sites.current.ready).toBe(false);
    expect(sites.current.value).toEqual([]);
    await flush();
    expect(sites.current.ready).toBe(true);
    expect(sites.current.value).toEqual([site]);
    expect(settings.current.value).toEqual(DEFAULT_SETTINGS);
  });

  it('writes through set and update', async () => {
    const store = createStore({ local: createFakeAdapter(), session: createFakeAdapter() });
    const notes = track(() => useNotes(store));
    await flush();
    await act(() => notes.current.set({ markdown: 'one', updatedAt: 1 }));
    expect(notes.current.value.markdown).toBe('one');
    await act(() => notes.current.update((n) => ({ ...n, markdown: n.markdown + '!' })));
    expect(notes.current.value.markdown).toBe('one!');
  });

  it('stays in sync when another page changes storage', async () => {
    const local = createFakeAdapter();
    const session = createFakeAdapter();
    const storeA = createStore({ local, session });
    const storeB = createStore({ local, session });
    const sitesA = track(() => useSites(storeA));
    const panelA = track(() => usePanelState(storeA));
    await flush();

    await act(() => storeB.sites.set([site]));
    await act(() => storeB.panelState.set({ activeItemId: 'a', urlBySiteId: {} }));
    expect(sitesA.current.value).toEqual([site]);
    expect(panelA.current.value.activeItemId).toBe('a');
  });

  it('stops listening to panel state on unmount', async () => {
    const store = createStore({ local: createFakeAdapter(), session: createFakeAdapter() });
    await store.panelState.set({ activeItemId: 'one', urlBySiteId: {} });

    const host = document.createElement('div');
    const ref = { current: undefined as unknown as StorageState<{ activeItemId: string }> };
    const Probe = () => {
      ref.current = usePanelState(store);
      return null;
    };
    act(() => render(<Probe />, host));
    await flush();
    expect(ref.current.value.activeItemId).toBe('one');

    act(() => render(null, host));
    await store.panelState.set({ activeItemId: 'late', urlBySiteId: {} });
    expect(ref.current.value.activeItemId).toBe('one');
  });
});
