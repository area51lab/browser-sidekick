import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import { fakeMedia } from '../helpers/fakeTheme';

const area = { get: async () => ({}), set: async () => undefined, remove: async () => undefined };
vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: area,
      session: area,
      onChanged: { addListener: () => undefined, removeListener: () => undefined },
    },
  },
}));

let media: ReturnType<typeof fakeMedia>;

beforeEach(() => {
  media = fakeMedia(true);
  document.body.innerHTML = '<div id="app"></div>';
  document.documentElement.className = '';
});

afterEach(() => media.restore());

describe('mount', () => {
  it('renders the view into #app and applies the dark scheme', async () => {
    const { mount } = await import('../../lib/mount');
    act(() => mount(<p>hello</p>));
    expect(document.getElementById('app')?.textContent).toBe('hello');
    expect(document.documentElement.classList.contains('wa-dark')).toBe(true);
  });
});
