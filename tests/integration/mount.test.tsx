import { describe, expect, it } from 'vitest';
import { render } from 'preact';
import { Hello } from '../../components/Hello';

describe('Hello', () => {
  it('renders the greeting and the Web Awesome button', () => {
    const host = document.createElement('div');
    render(<Hello surface="side panel" />, host);
    expect(host.querySelector('h1')?.textContent).toBe('Hello sidekick');
    expect(host.querySelector('wa-button')).not.toBeNull();
  });
});
