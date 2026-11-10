import { describe, expect, it } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useVisited } from '../../entrypoints/sidepanel/useVisited';

function probe() {
  const host = document.createElement('div');
  const out = { current: [] as string[] };
  const Probe = ({ active, ids }: { active: string | null; ids: string[] }) => {
    out.current = useVisited(active, ids);
    return null;
  };
  return {
    out,
    show: (active: string | null, ids: string[]) =>
      act(() => render(<Probe active={active} ids={ids} />, host)),
  };
}

describe('useVisited', () => {
  it('includes the active id immediately and remembers earlier ones', () => {
    const { out, show } = probe();
    show('a', ['a', 'b']);
    expect(out.current).toEqual(['a']);
    show('b', ['a', 'b']);
    expect(out.current).toEqual(['a', 'b']);
    show('a', ['a', 'b']);
    expect(out.current).toEqual(['a', 'b']);
  });

  it('drops ids that no longer exist and tolerates no active id', () => {
    const { out, show } = probe();
    show('a', ['a', 'b']);
    show('b', ['a', 'b']);
    show(null, ['b']);
    expect(out.current).toEqual(['b']);
  });
});
