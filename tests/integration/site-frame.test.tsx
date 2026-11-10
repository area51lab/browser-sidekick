import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import { render } from 'preact';

const create = vi.hoisted(() => vi.fn());
const perms = vi.hoisted(() => ({ has: vi.fn(), ensure: vi.fn() }));
vi.mock('wxt/browser', () => ({ browser: { tabs: { create } } }));
vi.mock('../../lib/embedding/permissions', () => ({
  hasSitePermission: perms.has,
  ensureSitePermission: perms.ensure,
}));

vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/spinner/spinner.js', () => ({}));

import { SiteFrame, isBlankFrame } from '../../components/SiteFrame';

let host: HTMLElement;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
const status = () => host.querySelector('.site-frame')?.getAttribute('data-status');
const frame = () => host.querySelector('iframe') as HTMLIFrameElement;

beforeEach(() => {
  vi.useFakeTimers();
  perms.has.mockResolvedValue(true);
  perms.ensure.mockResolvedValue(true);
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

describe('SiteFrame access', () => {
  it('shows the missing-permission reason with a grant action', async () => {
    perms.has.mockResolvedValue(false);
    await act(async () => {
      render(<SiteFrame url="https://mail.a.com/" />, host);
    });
    await flush();
    expect(status()).toBe('no-access');
    expect(host.textContent).toContain('does not have access');
    expect(host.textContent).not.toContain('refuses to be embedded');
    expect(host.querySelector('iframe')).toBeNull();
    const buttons = host.querySelectorAll('wa-button');
    expect(buttons).toHaveLength(2);
    (buttons[1] as HTMLElement).click();
    expect(create).toHaveBeenCalledWith({ url: 'https://mail.a.com/' });
  });

  it('reloads the frame after access is granted', async () => {
    perms.has.mockResolvedValue(false);
    await act(async () => {
      render(<SiteFrame url="https://a.com/" />, host);
    });
    await flush();
    perms.has.mockResolvedValue(true);
    await act(async () => {
      (host.querySelector('wa-button') as HTMLElement).click();
    });
    await flush();
    expect(perms.ensure).toHaveBeenCalledWith('https://a.com/');
    expect(status()).toBe('loading');
    expect(frame().getAttribute('src')).toBe('https://a.com/');
  });

  it('stays on the prompt when the grant is denied', async () => {
    perms.has.mockResolvedValue(false);
    perms.ensure.mockResolvedValue(false);
    await act(async () => {
      render(<SiteFrame url="https://a.com/" />, host);
    });
    await flush();
    await act(async () => {
      (host.querySelector('wa-button') as HTMLElement).click();
    });
    await flush();
    expect(status()).toBe('no-access');
    expect(host.textContent).toContain('Access was not granted');
  });

  it('shows the denied message when the permission request throws', async () => {
    perms.has.mockResolvedValue(false);
    perms.ensure.mockRejectedValue(new Error('not a subset of optional permissions'));
    await act(async () => {
      render(<SiteFrame url="https://a.com/" />, host);
    });
    await flush();
    await act(async () => {
      (host.querySelector('wa-button') as HTMLElement).click();
    });
    await flush();
    expect(status()).toBe('no-access');
    expect(host.textContent).toContain('Access was not granted');
  });

  it('ignores a permission result that arrives after unmount', async () => {
    let resolve!: (v: boolean) => void;
    perms.has.mockReturnValue(new Promise<boolean>((r) => (resolve = r)));
    await act(async () => {
      render(<SiteFrame url="https://a.com/" />, host);
    });
    await flush();
    await act(() => {
      render(null, host);
    });
    await act(() => {
      resolve(false);
    });
    expect(host.querySelector('.site-frame')).toBeNull();
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
