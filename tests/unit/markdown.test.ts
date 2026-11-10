// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../lib/markdown';

describe('renderMarkdown', () => {
  it('renders common markdown', () => {
    const html = renderMarkdown('# Title\n\n**bold** and `code`\n\n- a\n- b');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<li>a</li>');
  });

  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('strips script tags', () => {
    const html = renderMarkdown('hi <script>alert(1)</script>');
    expect(html).not.toContain('script');
    expect(html).not.toContain('alert');
  });

  it('strips javascript: links', () => {
    const html = renderMarkdown('[x](javascript:alert(1)) <a href="javascript:alert(2)">y</a>');
    expect(html).not.toContain('javascript:');
  });

  it('strips event handlers from images', () => {
    const html = renderMarkdown('![x](https://a.test/i.png "t") <img src="x" onerror="alert(1)">');
    expect(html).toContain('<img');
    expect(html).not.toContain('onerror');
  });

  it('strips inline event handlers and iframes', () => {
    const html = renderMarkdown(
      '<div onclick="alert(1)">a</div><iframe src="https://a.test"></iframe>',
    );
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('iframe');
  });

  it('opens links in a new tab with rel noopener', () => {
    const html = renderMarkdown('[site](https://a.test)');
    expect(html).toContain('href="https://a.test"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('leaves anchors without href alone', () => {
    expect(renderMarkdown('<a name="x">y</a>')).not.toContain('target=');
  });
});
