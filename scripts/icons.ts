import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

export const ICON_SIZES = [16, 32, 48, 128] as const;

export function renderIcon(svg: string, size: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

export function generateIcons(sourcePath: string, outDir: string): string[] {
  const svg = readFileSync(sourcePath, 'utf8');
  mkdirSync(outDir, { recursive: true });
  return ICON_SIZES.map((size) => {
    const file = `${outDir}/${size}.png`;
    writeFileSync(file, renderIcon(svg, size));
    return file;
  });
}
