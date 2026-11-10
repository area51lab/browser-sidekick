import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  formatColor,
  isDark,
  meetsAA,
  mix,
  parseColor,
  readableOn,
} from '../../lib/theme';

const white = { r: 255, g: 255, b: 255, a: 1 };
const black = { r: 0, g: 0, b: 0, a: 1 };

describe('parseColor', () => {
  it('parses hex in all lengths', () => {
    expect(parseColor('#fff')).toEqual(white);
    expect(parseColor(' #000000 ')).toEqual(black);
    expect(parseColor('#ff000080')?.a).toBeCloseTo(0.502, 2);
    expect(parseColor('#f008')?.r).toBe(255);
  });

  it('parses rgb and rgba', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('rgba(0 0 300 / 0.5)')).toEqual({ r: 0, g: 0, b: 255, a: 0.5 });
  });

  it('parses channel arrays', () => {
    expect(parseColor([1, 2, 3])).toEqual({ r: 1, g: 2, b: 3, a: 1 });
  });

  it('rejects anything else', () => {
    for (const value of [
      'red',
      '#12',
      'rgb(1,2)',
      'rgb(a,b,c)',
      'rgba(0,0,0,2)',
      [1, 2],
      null,
      4,
    ]) {
      expect(parseColor(value)).toBeNull();
    }
  });
});

describe('contrast', () => {
  it('computes the WCAG ratio', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5);
  });

  it('treats translucent colors as failing', () => {
    expect(contrastRatio({ ...black, a: 0.5 }, white)).toBe(0);
    expect(meetsAA({ ...black, a: 0.5 }, white)).toBe(false);
  });

  it('checks the AA threshold', () => {
    expect(meetsAA(black, white)).toBe(true);
    expect(meetsAA({ r: 150, g: 150, b: 150, a: 1 }, white)).toBe(false);
  });

  it('picks readable text', () => {
    expect(readableOn(black)).toEqual(white);
    expect(readableOn(white)).toEqual(black);
    const gray = { r: 119, g: 119, b: 119, a: 1 };
    expect(meetsAA(readableOn(gray), gray)).toBe(true);
  });
});

describe('helpers', () => {
  it('detects dark colors', () => {
    expect(isDark(black)).toBe(true);
    expect(isDark(white)).toBe(false);
  });

  it('mixes and formats', () => {
    expect(mix(black, white, 0.5)).toEqual({ r: 128, g: 128, b: 128, a: 1 });
    expect(formatColor(white)).toBe('rgb(255 255 255)');
    expect(formatColor({ ...white, a: 0.5 })).toBe('rgb(255 255 255 / 0.5)');
  });
});
