import { formatColor, isDark, meetsAA, mix, parseColor, readableOn } from './color';
import type { Rgba } from './color';

export type BrowserThemeColors = Record<string, unknown>;
export type ThemeTokens = Record<string, string>;

const SURFACE_PAIRS: readonly (readonly [string, string])[] = [
  ['popup', 'popup_text'],
  ['toolbar', 'toolbar_text'],
  ['frame', 'tab_background_text'],
];
const BORDER_KEYS = ['popup_border', 'sidebar_border'] as const;
const ACCENT_KEYS = ['icons_attention', 'tab_line', 'button_background_active'] as const;

const read = (colors: BrowserThemeColors, key: string): Rgba | null => parseColor(colors[key]);

function pickSurface(colors: BrowserThemeColors): { surface: Rgba; text: Rgba } | null {
  for (const [surfaceKey, textKey] of SURFACE_PAIRS) {
    const surface = read(colors, surfaceKey);
    const text = read(colors, textKey);
    if (surface && text && meetsAA(text, surface)) return { surface, text };
  }
  return null;
}

function surfaceTokens(surface: Rgba, text: Rgba, colors: BrowserThemeColors): ThemeTokens {
  const frame = read(colors, 'frame');
  const quiet = mix(text, surface, 0.25);
  const border =
    BORDER_KEYS.map((key) => read(colors, key)).find(Boolean) ?? mix(surface, text, 0.2);
  const tokens: ThemeTokens = {
    'color-scheme': isDark(surface) ? 'dark' : 'light',
    '--wa-color-surface-default': formatColor(surface),
    '--wa-color-surface-raised': formatColor(surface),
    '--wa-color-surface-lowered': formatColor(frame && meetsAA(text, frame) ? frame : surface),
    '--wa-color-text-normal': formatColor(text),
    '--wa-color-text-quiet': formatColor(meetsAA(quiet, surface) ? quiet : text),
    '--wa-color-surface-border': formatColor(border),
  };
  return tokens;
}

function brandTokens(surface: Rgba, text: Rgba, colors: BrowserThemeColors): ThemeTokens {
  const accent = ACCENT_KEYS.map((key) => read(colors, key)).find((color) => color?.a === 1);
  if (!accent) return {};
  const tokens: ThemeTokens = { '--wa-color-brand-border-normal': formatColor(accent) };
  tokens['--wa-color-brand-fill-loud'] = formatColor(accent);
  tokens['--wa-color-brand-on-loud'] = formatColor(readableOn(accent));
  const quietFill = mix(surface, accent, 0.18);
  if (meetsAA(text, quietFill)) {
    tokens['--wa-color-brand-fill-quiet'] = formatColor(quietFill);
    tokens['--wa-color-brand-on-quiet'] = formatColor(text);
  }
  return tokens;
}

/**
 * Maps Firefox theme colors to Web Awesome tokens. Text and surface come from the first of
 * popup, toolbar or frame whose pair passes WCAG AA; when none does, no token is returned so
 * the default theme applies.
 */
export function mapBrowserTheme(colors: BrowserThemeColors | null | undefined): ThemeTokens {
  if (!colors) return {};
  const base = pickSurface(colors);
  if (!base) return {};
  return {
    ...surfaceTokens(base.surface, base.text, colors),
    ...brandTokens(base.surface, base.text, colors),
  };
}
