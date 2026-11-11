import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

type Details = { tabId: number; frameId: number; parentFrameId: number; url: string };
type Listener = (details: Details) => Promise<void>;

const committed = new Set<Listener>();
const historyUpdated = new Set<Listener>();
const getFrame = vi.fn();
const eventOf = (set: Set<Listener>) => ({
  addListener: (l: Listener) => set.add(l),
  removeListener: (l: Listener) => set.delete(l),
});

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: { getURL: () => 'chrome-extension://x/' },
    webNavigation: {
      getFrame,
      onCommitted: eventOf(committed),
      onHistoryStateUpdated: eventOf(historyUpdated),
    },
  },
}));

const { useSiteUrlTracking, isExtensionChildFrame } =
  await import('../../entrypoints/sidepanel/useSiteUrlTracking');
const { defaultPanelState } = await import('../../lib/storage');
import type { PanelState, Site } from '../../lib/storage';

const sites: Site[] = [{ id: 'a', url: 'https://a.test/', title: 'A', createdAt: 1 }];
const details = (over: Partial<Details> = {}): Details => ({
  tabId: 1,
  frameId: 5,
  parentFrameId: 0,
  url: 'https://a.test/page',
  ...over,
});

function mount(currentSites: Site[] = sites) {
  const host = document.createElement('div');
  let state: PanelState = defaultPanelState();
  const update = vi.fn(async (change: (s: PanelState) => PanelState) => {
    state = change(state);
  });
  const Probe = ({ list }: { list: Site[] }) => {
    useSiteUrlTracking(list, update);
    return null;
  };
  act(() => render(<Probe list={currentSites} />, host));
  return {
    update,
    state: () => state,
    rerender: (list: Site[]) => act(() => render(<Probe list={list} />, host)),
    unmount: () => act(() => render(null, host)),
  };
}

const fire = (set: Set<Listener>, d: Details) =>
  act(async () => {
    await Promise.all([...set].map((l) => l(d)));
  });

beforeEach(() => {
  committed.clear();
  historyUpdated.clear();
  getFrame.mockReset();
  getFrame.mockResolvedValue({ url: 'chrome-extension://x/sidepanel.html' });
});

describe('isExtensionChildFrame', () => {
  it('rejects the top frame without querying', async () => {
    expect(await isExtensionChildFrame(details({ frameId: 0 }))).toBe(false);
    expect(getFrame).not.toHaveBeenCalled();
  });

  it('accepts frames whose parent is an extension page', async () => {
    expect(await isExtensionChildFrame(details())).toBe(true);
    expect(getFrame).toHaveBeenCalledWith({ tabId: 1, frameId: 0 });
  });

  it('rejects frames of regular pages, unknown parents and lookup failures', async () => {
    getFrame.mockResolvedValueOnce({ url: 'https://host.test/' });
    expect(await isExtensionChildFrame(details())).toBe(false);
    getFrame.mockResolvedValueOnce(undefined);
    expect(await isExtensionChildFrame(details())).toBe(false);
    getFrame.mockRejectedValueOnce(new Error('gone'));
    expect(await isExtensionChildFrame(details())).toBe(false);
  });
});

describe('useSiteUrlTracking', () => {
  it('records committed and history state navigations of embedded sites', async () => {
    const { state } = mount();
    await fire(committed, details());
    expect(state().urlBySiteId).toEqual({ a: 'https://a.test/page' });
    await fire(historyUpdated, details({ url: 'https://a.test/spa' }));
    expect(state().urlBySiteId).toEqual({ a: 'https://a.test/spa' });
  });

  it('ignores frames outside the extension, the top frame and unknown sites', async () => {
    const { update } = mount();
    getFrame.mockResolvedValueOnce({ url: 'https://host.test/' });
    await fire(committed, details());
    await fire(committed, details({ frameId: 0 }));
    await fire(committed, details({ url: 'https://other.test/' }));
    expect(update).not.toHaveBeenCalled();
  });

  it('uses the latest sites without resubscribing and unsubscribes on unmount', async () => {
    const { state, rerender, unmount } = mount([]);
    rerender(sites);
    expect(committed.size).toBe(1);
    await fire(committed, details());
    expect(state().urlBySiteId).toEqual({ a: 'https://a.test/page' });
    unmount();
    expect(committed.size).toBe(0);
    expect(historyUpdated.size).toBe(0);
  });
});
