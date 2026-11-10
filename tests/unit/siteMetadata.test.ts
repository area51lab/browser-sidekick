import { describe, expect, it } from 'vitest';
import { fetchSiteMetadata, normalizeUrl, parseSiteMetadata } from '../../lib/siteMetadata';

const page = (head: string) => `<!doctype html><html><head>${head}</head><body></body></html>`;

const htmlResponse = (body: string, init: ResponseInit & { url?: string } = {}) => {
  const response = new Response(body, {
    status: init.status ?? 200,
    headers: init.headers ?? { 'content-type': 'text/html; charset=utf-8' },
  });
  if (init.url) Object.defineProperty(response, 'url', { value: init.url });
  return response;
};

const fakeFetch =
  (respond: (url: string) => Response | Promise<Response>) => (input: RequestInfo | URL) =>
    Promise.resolve(respond(String(input)));

describe('normalizeUrl', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['  example.com/path?q=1 ', 'https://example.com/path?q=1'],
    ['http://example.com', 'http://example.com/'],
    ['HTTPS://Example.com', 'https://example.com/'],
    ['localhost:3000', 'https://localhost:3000/'],
    ['localhost:3000/app', 'https://localhost:3000/app'],
  ])('accepts %s', (input, expected) => expect(normalizeUrl(input)).toBe(expected));

  it.each([
    '',
    '   ',
    'javascript:alert(1)',
    'ftp://example.com',
    'file:///etc/passwd',
    'data:text/html,hi',
    'http://',
  ])('rejects %j', (input) => expect(normalizeUrl(input)).toBeNull());
});

describe('parseSiteMetadata', () => {
  const url = 'https://example.com/docs/page';

  it('uses the title and falls back to /favicon.ico', () => {
    expect(parseSiteMetadata(page('<title>  Hello\n  World </title>'), url)).toEqual({
      title: 'Hello World',
      faviconUrl: 'https://example.com/favicon.ico',
    });
  });

  it('prefers og:site_name over title', () => {
    const html = page(
      '<title>Long page title</title><meta property="og:site_name" content="Brand">',
    );
    expect(parseSiteMetadata(html, url).title).toBe('Brand');
  });

  it('falls back to the hostname without title', () => {
    expect(parseSiteMetadata(page(''), url).title).toBe('example.com');
  });

  it('resolves relative icon URLs', () => {
    expect(parseSiteMetadata(page('<link rel="icon" href="../icon.png">'), url).faviconUrl).toBe(
      'https://example.com/icon.png',
    );
    expect(
      parseSiteMetadata(page('<link rel="shortcut icon" href="//cdn.test/i.ico">'), url).faviconUrl,
    ).toBe('https://cdn.test/i.ico');
  });

  it('prefers the largest declared size', () => {
    const html = page(
      '<link rel="icon" sizes="16x16" href="/16.png"><link rel="icon" sizes="64x64" href="/64.png"><link rel="icon" sizes="32x32" href="/32.png">',
    );
    expect(parseSiteMetadata(html, url).faviconUrl).toBe('https://example.com/64.png');
  });

  it('prefers apple-touch-icon over an equally sized icon and over unsized icons', () => {
    const html = page(
      '<link rel="icon" href="/plain.png"><link rel="apple-touch-icon" href="/apple.png">',
    );
    expect(parseSiteMetadata(html, url).faviconUrl).toBe('https://example.com/apple.png');
    const tie = page(
      '<link rel="icon" sizes="180x180" href="/i.png"><link rel="apple-touch-icon" sizes="180x180" href="/a.png">',
    );
    expect(parseSiteMetadata(tie, url).faviconUrl).toBe('https://example.com/a.png');
  });

  it('handles apple-touch-icon-precomposed and scalable "any" sizes', () => {
    const html = page(
      '<link rel="apple-touch-icon-precomposed" href="/pre.png"><link rel="icon" sizes="any" href="/vector.svg">',
    );
    expect(parseSiteMetadata(html, url).faviconUrl).toBe('https://example.com/vector.svg');
    expect(
      parseSiteMetadata(page('<link rel="apple-touch-icon-precomposed" href="/pre.png">'), url)
        .faviconUrl,
    ).toBe('https://example.com/pre.png');
  });

  it('ignores icons without href, with invalid or non-web URLs, and mask icons', () => {
    const html = page(
      '<link rel="icon"><link rel="icon" href="  "><link rel="icon" href="data:image/png;base64,AAAA"><link rel="icon" href="http://[bad"><link rel="mask-icon" href="/mask.svg">',
    );
    expect(parseSiteMetadata(html, url).faviconUrl).toBe('https://example.com/favicon.ico');
  });

  it('keeps the first icon when scores tie', () => {
    const html = page('<link rel="icon" href="/first.png"><link rel="icon" href="/second.png">');
    expect(parseSiteMetadata(html, url).faviconUrl).toBe('https://example.com/first.png');
  });
});

describe('fetchSiteMetadata', () => {
  it('returns parsed metadata', async () => {
    const fetch = fakeFetch(() =>
      htmlResponse(page('<title>Example</title><link rel="icon" href="/i.png">'), {
        url: 'https://example.com/',
      }),
    );
    expect(await fetchSiteMetadata('example.com', { fetch })).toEqual({
      title: 'Example',
      faviconUrl: 'https://example.com/i.png',
    });
  });

  it('resolves icons against the final redirected URL', async () => {
    const fetch = fakeFetch(() =>
      htmlResponse(page('<title>Moved</title><link rel="icon" href="/i.png">'), {
        url: 'https://www.example.org/home',
      }),
    );
    expect((await fetchSiteMetadata('example.com', { fetch })).faviconUrl).toBe(
      'https://www.example.org/i.png',
    );
  });

  it('requests with credentials omitted', async () => {
    let init: RequestInit | undefined;
    const fetch = (_: RequestInfo | URL, options?: RequestInit) => {
      init = options;
      return Promise.resolve(htmlResponse(page('')));
    };
    await fetchSiteMetadata('example.com', { fetch });
    expect(init?.credentials).toBe('omit');
  });

  it('rejects invalid URLs without fetching', async () => {
    let called = false;
    const fetch = fakeFetch(() => ((called = true), htmlResponse('')));
    expect(await fetchSiteMetadata('javascript:alert(1)', { fetch })).toEqual({
      title: '',
      faviconUrl: '',
      error: 'invalid-url',
    });
    expect(called).toBe(false);
  });

  it('returns a partial result on HTTP errors', async () => {
    const fetch = fakeFetch(() => htmlResponse('nope', { status: 404 }));
    expect(await fetchSiteMetadata('https://example.com/x', { fetch })).toEqual({
      title: 'example.com',
      faviconUrl: 'https://example.com/favicon.ico',
      error: 'http',
    });
  });

  it('returns a partial result on network errors', async () => {
    const fetch = () => Promise.reject(new TypeError('Failed to fetch'));
    expect(await fetchSiteMetadata('example.com', { fetch })).toEqual({
      title: 'example.com',
      faviconUrl: 'https://example.com/favicon.ico',
      error: 'network',
    });
  });

  it('times out slow responses', async () => {
    const fetch = (_: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        ),
      );
    const result = await fetchSiteMetadata('example.com', { fetch, timeoutMs: 10 });
    expect(result.error).toBe('timeout');
    expect(result.title).toBe('example.com');
  });

  it('skips parsing non-HTML content', async () => {
    const fetch = fakeFetch(() =>
      htmlResponse('{}', { headers: { 'content-type': 'application/json' } }),
    );
    expect(await fetchSiteMetadata('example.com/api', { fetch })).toEqual({
      title: 'example.com',
      faviconUrl: 'https://example.com/favicon.ico',
    });
  });

  it('parses responses without a content type', async () => {
    const bare = {
      ok: true,
      url: '',
      headers: new Headers(),
      text: () => Promise.resolve(page('<title>No type</title>')),
    } as Response;
    const fetch = fakeFetch(() => bare);
    expect((await fetchSiteMetadata('example.com', { fetch })).title).toBe('No type');
  });

  it('returns a partial result when reading the body fails', async () => {
    const broken = htmlResponse('x');
    broken.text = () => Promise.reject(new Error('boom'));
    const fetch = fakeFetch(() => broken);
    expect((await fetchSiteMetadata('example.com', { fetch })).error).toBe('network');
  });
});
