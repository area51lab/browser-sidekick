import { describe, expect, it } from 'vitest';
import { render } from 'preact';
import { SiteView } from '../../components/SiteView';

describe('SiteView', () => {
  it('renders an iframe titled with the site name and pointing at the url', () => {
    const host = document.createElement('div');
    const site = {
      id: 'a',
      url: 'https://a.test',
      title: 'Alpha',
      customName: 'Mine',
      createdAt: 1,
    };
    render(<SiteView site={site} url="about:blank" />, host);
    const frame = host.querySelector('iframe')!;
    expect(frame.getAttribute('src')).toBe('about:blank');
    expect(frame.title).toBe('Mine');
  });
});
