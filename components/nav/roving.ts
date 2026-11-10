export type Orientation = 'horizontal' | 'vertical';

const STEP_KEYS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

export function nextIndex(key: string, index: number, count: number): number | null {
  if (count === 0) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const step = STEP_KEYS[key];
  return step === undefined ? null : (index + step + count) % count;
}
