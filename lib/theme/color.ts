export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const AA_CONTRAST = 4.5;

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

const clampByte = (value: number): number => Math.min(255, Math.max(0, Math.round(value)));
const isChannel = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function parseHex(value: string): Rgba | null {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value);
  if (!match) return null;
  const hex = match[1]!;
  const digits = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
  const byte = (index: number) => parseInt(digits.slice(index * 2, index * 2 + 2), 16);
  return { r: byte(0), g: byte(1), b: byte(2), a: digits.length === 8 ? byte(3) / 255 : 1 };
}

function parseFunctional(value: string): Rgba | null {
  const match = /^rgba?\(\s*([^)]+?)\s*\)$/i.exec(value);
  if (!match) return null;
  const parts = match[1]!.split(/[\s,/]+/).filter(Boolean);
  if (parts.length !== 3 && parts.length !== 4) return null;
  const [r, g, b] = parts.slice(0, 3).map(Number) as [number, number, number];
  const a = parts.length === 4 ? Number(parts[3]) : 1;
  if (![r, g, b, a].every(isChannel) || a < 0 || a > 1) return null;
  return { r: clampByte(r), g: clampByte(g), b: clampByte(b), a };
}

/** Parses the color formats Firefox themes use: hex, `rgb()`/`rgba()` and `[r, g, b]` arrays. */
export function parseColor(value: unknown): Rgba | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return parseHex(trimmed) ?? parseFunctional(trimmed);
  }
  if (Array.isArray(value) && value.length === 3 && value.every(isChannel)) {
    const [r, g, b] = value as [number, number, number];
    return { r: clampByte(r), g: clampByte(g), b: clampByte(b), a: 1 };
  }
  return null;
}

export function formatColor({ r, g, b, a }: Rgba): string {
  return a === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${Number(a.toFixed(3))})`;
}

const linear = (channel: number): number => {
  const unit = channel / 255;
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};

export const luminance = ({ r, g, b }: Rgba): number =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/** Returns the WCAG contrast ratio, or 0 when either color is translucent and so cannot be judged. */
export function contrastRatio(foreground: Rgba, background: Rgba): number {
  if (foreground.a !== 1 || background.a !== 1) return 0;
  const [first, second] = [luminance(foreground), luminance(background)];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export const meetsAA = (foreground: Rgba, background: Rgba): boolean =>
  contrastRatio(foreground, background) >= AA_CONTRAST;

export const isDark = (color: Rgba): boolean => luminance(color) < 0.18;

/** Mixes `amount` (0 to 1) of `top` over `base`. */
export function mix(base: Rgba, top: Rgba, amount: number): Rgba {
  const channel = (from: number, to: number) => clampByte(from + (to - from) * amount);
  return { r: channel(base.r, top.r), g: channel(base.g, top.g), b: channel(base.b, top.b), a: 1 };
}

/** Black or white, whichever contrasts more; one of them always reaches AA on any opaque color. */
export const readableOn = (background: Rgba): Rgba =>
  contrastRatio(WHITE, background) >= contrastRatio(BLACK, background) ? WHITE : BLACK;
