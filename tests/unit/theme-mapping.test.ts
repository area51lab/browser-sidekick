import { describe, expect, it } from 'vitest';
import { mapBrowserTheme } from '../../lib/theme';

describe('mapBrowserTheme', () => {
  it('returns no tokens without colors', () => {
    expect(mapBrowserTheme(null)).toEqual({});
    expect(mapBrowserTheme(undefined)).toEqual({});
    expect(mapBrowserTheme({})).toEqual({});
  });

  it('maps a dark theme to surface, text, border and brand tokens', () => {
    const tokens = mapBrowserTheme({
      popup: '#1c1b22',
      popup_text: '#fbfbfe',
      popup_border: '#444444',
      frame: '#0c0c0d',
      icons_attention: '#00ddff',
    });
    expect(tokens['color-scheme']).toBe('dark');
    expect(tokens['--wa-color-surface-default']).toBe('rgb(28 27 34)');
    expect(tokens['--wa-color-surface-lowered']).toBe('rgb(12 12 13)');
    expect(tokens['--wa-color-text-normal']).toBe('rgb(251 251 254)');
    expect(tokens['--wa-color-surface-border']).toBe('rgb(68 68 68)');
    expect(tokens['--wa-color-brand-fill-loud']).toBe('rgb(0 221 255)');
    expect(tokens['--wa-color-brand-on-loud']).toBe('rgb(0 0 0)');
    expect(tokens['--wa-color-brand-fill-quiet']).toBeDefined();
    expect(tokens['--wa-color-brand-on-quiet']).toBe('rgb(251 251 254)');
  });

  it('falls back from popup to toolbar to frame pairs', () => {
    const toolbar = mapBrowserTheme({
      popup: '#777777',
      popup_text: '#888888',
      toolbar: '#ffffff',
      toolbar_text: '#000000',
    });
    expect(toolbar['--wa-color-surface-default']).toBe('rgb(255 255 255)');
    const frame = mapBrowserTheme({ frame: '#000000', tab_background_text: '#ffffff' });
    expect(frame['--wa-color-surface-default']).toBe('rgb(0 0 0)');
  });

  it('returns defaults when no pair passes AA', () => {
    expect(
      mapBrowserTheme({ popup: '#777777', popup_text: '#888888', toolbar: '#fff', frame: '#fff' }),
    ).toEqual({});
  });

  it('ignores unusable pairs and translucent colors', () => {
    expect(mapBrowserTheme({ popup: 'rgba(0,0,0,0.5)', popup_text: '#fff' })).toEqual({});
    expect(mapBrowserTheme({ popup: '#000' })).toEqual({});
  });

  it('derives border and uses surface when frame fails contrast', () => {
    const tokens = mapBrowserTheme({
      popup: '#ffffff',
      popup_text: '#000000',
      frame: '#222222',
    });
    expect(tokens['--wa-color-surface-lowered']).toBe('rgb(255 255 255)');
    expect(tokens['--wa-color-surface-border']).toBe('rgb(204 204 204)');
    expect(tokens['--wa-color-text-quiet']).toBe('rgb(64 64 64)');
    expect(tokens['color-scheme']).toBe('light');
  });

  it('uses plain text when the quiet mix would fail AA', () => {
    const tokens = mapBrowserTheme({ popup: '#808080', popup_text: '#000000' });
    expect(tokens['--wa-color-text-quiet']).toBe('rgb(0 0 0)');
  });

  it('skips the quiet brand fill when text on it fails AA', () => {
    const tokens = mapBrowserTheme({
      popup: '#767676',
      popup_text: '#000000',
      tab_line: '#000000',
    });
    expect(tokens['--wa-color-brand-fill-loud']).toBe('rgb(0 0 0)');
    expect(tokens['--wa-color-brand-on-loud']).toBe('rgb(255 255 255)');
    expect(tokens['--wa-color-brand-fill-quiet']).toBeUndefined();
    expect(tokens['--wa-color-brand-on-quiet']).toBeUndefined();
  });

  it('ignores translucent accents', () => {
    const tokens = mapBrowserTheme({
      popup: '#fff',
      popup_text: '#000',
      icons_attention: 'rgba(0,0,0,0.5)',
    });
    expect(Object.keys(tokens).some((key) => key.includes('brand'))).toBe(false);
  });
});
