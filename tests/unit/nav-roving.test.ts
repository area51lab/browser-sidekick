import { describe, expect, it } from 'vitest';
import { nextIndex } from '../../components/nav/roving';

describe('nextIndex', () => {
  it('moves forward and backward with wrap-around', () => {
    expect(nextIndex('ArrowRight', 0, 3)).toBe(1);
    expect(nextIndex('ArrowDown', 2, 3)).toBe(0);
    expect(nextIndex('ArrowLeft', 0, 3)).toBe(2);
    expect(nextIndex('ArrowUp', 1, 3)).toBe(0);
  });

  it('jumps with Home and End', () => {
    expect(nextIndex('Home', 2, 4)).toBe(0);
    expect(nextIndex('End', 0, 4)).toBe(3);
  });

  it('ignores other keys and empty lists', () => {
    expect(nextIndex('a', 0, 3)).toBeNull();
    expect(nextIndex('ArrowRight', 0, 0)).toBeNull();
  });
});
