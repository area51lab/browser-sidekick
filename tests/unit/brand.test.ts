import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_NAME, DISPLAY_NAME } from '../../lib/brand';

describe('brand', () => {
  it('keeps the plain name free of emoji and derives the display name from it', () => {
    expect(APP_NAME).toBe('SideKick');
    expect(DISPLAY_NAME).toBe('SideKick 🦾');
  });

  it.each(['entrypoints/options/index.html', 'entrypoints/sidepanel/index.html'])(
    '%s uses the display name as its title',
    (file) => {
      expect(readFileSync(file, 'utf8')).toContain(`<title>${DISPLAY_NAME}</title>`);
    },
  );
});
