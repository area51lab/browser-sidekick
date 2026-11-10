import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateIcons, ICON_SIZES, renderIcon } from '../../scripts/icons';

const PNG_SIGNATURE = '89504e470d0a1a0a';

function pngWidth(buffer: Buffer): number {
  return buffer.readUInt32BE(16);
}

describe('icons', () => {
  it('renders a PNG of the requested width', () => {
    const svg = readFileSync('assets/icon.svg', 'utf8');
    const png = renderIcon(svg, 48);
    expect(png.subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE);
    expect(pngWidth(png)).toBe(48);
  });

  it('generates every manifest size', () => {
    const out = mkdtempSync(join(tmpdir(), 'icons-'));
    const files = generateIcons('assets/icon.svg', out);
    expect(files).toHaveLength(ICON_SIZES.length);
    files.forEach((file, i) => {
      expect(existsSync(file)).toBe(true);
      expect(pngWidth(readFileSync(file))).toBe(ICON_SIZES[i]);
    });
  });

  it('keeps committed icons in sync with the sizes list', () => {
    ICON_SIZES.forEach((size) => {
      expect(pngWidth(readFileSync(`public/icon/${size}.png`))).toBe(size);
    });
  });
});
