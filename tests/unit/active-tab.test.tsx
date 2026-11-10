import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

type Listener = (info: { tabId: number; windowId: number }) => void;
const listeners = new Set<Listener>();
const query = vi.fn();

vi.mock('wxt/browser', () => ({
  browser: {
    tabs: {
      query,
      onActivated: {
        addListener: (l: Listener) => listeners.add(l),
        removeListener: (l: Listener) => listeners.delete(l),
      },
    },
  },
}));

const { useActiveTabId } = await import('../../entrypoints/sidepanel/useActiveTabId');

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

function mountProbe() {
  const host = document.createElement('div');
  const out = { current: undefined as number | undefined };
  const Probe = () => {
    out.current = useActiveTabId();
    return null;
  };
  act(() => render(<Probe />, host));
  return { out, unmount: () => act(() => render(null, host)) };
}

describe('useActiveTabId', () => {
  beforeEach(() => {
    listeners.clear();
    query.mockReset();
  });

  it('resolves the active tab then follows activation in the same window', async () => {
    query.mockResolvedValue([{ id: 5, windowId: 1 }]);
    const { out, unmount } = mountProbe();
    expect(out.current).toBeUndefined();
    await flush();
    expect(out.current).toBe(5);

    act(() => listeners.forEach((l) => l({ tabId: 9, windowId: 2 })));
    expect(out.current).toBe(5);
    act(() => listeners.forEach((l) => l({ tabId: 7, windowId: 1 })));
    expect(out.current).toBe(7);

    unmount();
    expect(listeners.size).toBe(0);
  });

  it('stays undefined when no tab is found', async () => {
    query.mockResolvedValue([]);
    const { out } = mountProbe();
    await flush();
    expect(out.current).toBeUndefined();
  });

  it('does not overwrite an activation that arrived before the query resolved', async () => {
    query.mockResolvedValue([{ id: 5, windowId: 1 }]);
    const { out } = mountProbe();
    act(() => listeners.forEach((l) => l({ tabId: 8, windowId: 1 })));
    await flush();
    expect(out.current).toBe(8);
  });
});
