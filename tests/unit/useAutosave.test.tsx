import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useAutosave } from '../../components/notes/useAutosave';
import type { Autosave } from '../../components/notes/useAutosave';

function mountAutosave(save: (value: string) => Promise<void>) {
  const host = document.createElement('div');
  const ref = { current: undefined as unknown as Autosave };
  const Probe = () => {
    ref.current = useAutosave(save);
    return null;
  };
  act(() => render(<Probe />, host));
  return { ref, unmount: () => act(() => render(null, host)) };
}

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces saves and keeps the last value', async () => {
    const save = vi.fn(async () => {});
    const { ref, unmount } = mountAutosave(save);
    act(() => ref.current.schedule('a'));
    act(() => void vi.advanceTimersByTime(300));
    act(() => ref.current.schedule('ab'));
    expect(ref.current.status).toBe('pending');
    act(() => void vi.advanceTimersByTime(399));
    expect(save).not.toHaveBeenCalled();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1)));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('ab');
    expect(ref.current.status).toBe('saved');
    unmount();
  });

  it('flushes immediately and only once', async () => {
    const save = vi.fn(async () => {});
    const { ref, unmount } = mountAutosave(save);
    act(() => ref.current.schedule('x'));
    await act(async () => ref.current.flush());
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    expect(save).toHaveBeenCalledTimes(1);
    ref.current.flush();
    expect(save).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('flushes when the page becomes hidden', () => {
    const save = vi.fn(async () => {});
    const { ref, unmount } = mountAutosave(save);
    act(() => ref.current.schedule('x'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(save).not.toHaveBeenCalled();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(save).toHaveBeenCalledWith('x');
    vi.restoreAllMocks();
    unmount();
  });

  it.each(['pagehide', 'beforeunload'])('flushes on %s', (name) => {
    const save = vi.fn(async () => {});
    const { ref, unmount } = mountAutosave(save);
    act(() => ref.current.schedule('x'));
    window.dispatchEvent(new Event(name));
    expect(save).toHaveBeenCalledWith('x');
    unmount();
  });

  it('flushes on unmount', () => {
    const save = vi.fn(async () => {});
    const { ref, unmount } = mountAutosave(save);
    act(() => ref.current.schedule('x'));
    unmount();
    expect(save).toHaveBeenCalledWith('x');
  });

  it('stays pending when more input arrives during a save', async () => {
    let finish = () => {};
    const save = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { ref, unmount } = mountAutosave(save);
    act(() => ref.current.schedule('a'));
    await act(async () => void (await vi.advanceTimersByTimeAsync(400)));
    act(() => ref.current.schedule('ab'));
    await act(async () => finish());
    expect(ref.current.status).toBe('pending');
    unmount();
  });
});
