import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import { render } from 'preact';

const create = vi.hoisted(() => vi.fn());
vi.mock('wxt/browser', () => ({ browser: { tabs: { create } } }));

vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/spinner/spinner.js', () => ({}));

import { SiteFrame, isBlankFrame } from '../../components/SiteFrame';

let host: HTMLElement;

const status = () => host.querySelector('.site-frame')?.getAttribute('data-status');
const frame = () => host.querySelector('iframe') as HTMLIFrameElement;

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement('div');
});

afterEach(() => {
  render(null, host);
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('SiteFrame', () => {
  it('renders the iframe with a spinner while loading', async () => {
    await act(() => {
      render(<SiteFrame url="https://a.com/" title="A" />, host);
    });
    expect(status()).toBe('loading');
    expect(frame().getAttribute('src')).toBe('https://a.com/');
    expect(frame().title).toBe('A');
    expect(host.querySelector('wa-spinner')).not.toBeNull();
  });

  it('falls back to the url as title', async () => {
    await act(() => {
      render(<SiteFrame url="https://a.com/" />, host);
    });
    expect(frame().title).toBe('https://a.com/');
  });

  it('becomes ready on load and ignores the timeout afterwards', async () => {
    await act(() => {
      render(<SiteFrame url="https://a.com/" timeoutMs={100} />, host);
    });
    vi.spyOn(frame(), 'contentDocument', 'get').mockReturnValue({
      location: { href: 'https://a.com/' },
    } as unknown as Document);
    await act(() => {
      frame().dispatchEvent(new Event('load'));
    });
    expect(status()).toBe('ready');
    expect(host.querySelector('wa-spinner')).toBeNull();
    await act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(status()).toBe('ready');
  });

  it('shows the fallback when the frame never loads', async () => {
    await act(() => {
      render(<SiteFrame url="https://a.com/" timeoutMs={100} />, host);
    });
    await act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(status()).toBe('refused');
    expect(host.textContent).toContain('This site refuses to be embedded');
    expect(host.querySelector('iframe')).toBeNull();
  });

  it('shows the fallback on error and on a blank document', async () => {
    await act(() => {
      render(<SiteFrame url="https://a.com/" />, host);
    });
    await act(() => {
      frame().dispatchEvent(new Event('error'));
    });
    expect(status()).toBe('refused');

    await act(() => {
      render(null, host);
    });
    await act(() => {
      render(<SiteFrame url="https://b.com/" />, host);
    });
    vi.spyOn(frame(), 'contentDocument', 'get').mockReturnValue({
      location: { href: 'about:blank' },
    } as unknown as Document);
    await act(() => {
      frame().dispatchEvent(new Event('load'));
    });
    expect(status()).toBe('refused');
  });

  it('opens the site in a new tab from the fallback', async () => {
    await act(() => {
      render(<SiteFrame url="https://a.com/" timeoutMs={10} />, host);
    });
    await act(() => {
      vi.advanceTimersByTime(10);
    });
    (host.querySelector('wa-button') as HTMLElement).click();
    expect(create).toHaveBeenCalledWith({ url: 'https://a.com/' });
  });

  it('resets to loading when the url changes', async () => {
    await act(() => {
      render(<SiteFrame url="https://a.com/" timeoutMs={10} />, host);
    });
    await act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(status()).toBe('refused');
    await act(() => {
      render(<SiteFrame url="https://b.com/" timeoutMs={10} />, host);
    });
    expect(status()).toBe('loading');
    expect(frame().getAttribute('src')).toBe('https://b.com/');
  });
});

describe('isBlankFrame', () => {
  it('is false when the document is cross-origin and inaccessible', () => {
    const el = document.createElement('iframe');
    vi.spyOn(el, 'contentDocument', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(isBlankFrame(el)).toBe(false);
  });

  it('is false when there is no document', () => {
    const el = document.createElement('iframe');
    vi.spyOn(el, 'contentDocument', 'get').mockReturnValue(null);
    expect(isBlankFrame(el)).toBe(false);
  });
});
