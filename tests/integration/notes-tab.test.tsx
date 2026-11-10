// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { NotesTab } from '../../components/notes/NotesTab';
import { createStore } from '../../lib/storage/store';
import type { Store } from '../../lib/storage/store';
import { createFakeAdapter } from '../helpers/fakeStorage';
import type { FakeAdapter } from '../helpers/fakeStorage';

vi.mock('@awesome.me/webawesome/dist/components/button/button.js', () => ({}));
vi.mock('@awesome.me/webawesome/dist/components/textarea/textarea.js', () => ({}));

const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

const hosts: HTMLElement[] = [];

function mountTab(store: Store) {
  const host = document.createElement('div');
  document.body.append(host);
  hosts.push(host);
  act(() => render(<NotesTab store={store} />, host));
  return { host, unmount: () => act(() => render(null, host)) };
}

const setup = (local: FakeAdapter = createFakeAdapter()) => ({
  local,
  store: createStore({ local, session: createFakeAdapter() }),
});

const textarea = (host: HTMLElement) =>
  host.querySelector('wa-textarea') as unknown as HTMLTextAreaElement;
const valueOf = (field: HTMLTextAreaElement) => field.value || field.getAttribute('value');
const button = (host: HTMLElement, label: string) =>
  [...host.querySelectorAll('wa-button')].find((el) => el.textContent === label) as HTMLElement;

const type = (host: HTMLElement, value: string) =>
  act(() => {
    const field = textarea(host);
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });

const stored = (local: FakeAdapter) =>
  (local.data.notes as { markdown: string } | undefined)?.markdown;

describe('NotesTab', () => {
  afterEach(() => {
    hosts.splice(0).forEach((host) => {
      render(null, host);
      host.remove();
    });
  });

  it('loads stored notes into the editor', async () => {
    const { local, store } = setup(
      createFakeAdapter({ schemaVersion: 1, notes: { markdown: 'hello', updatedAt: 1 } }),
    );
    const { host } = mountTab(store);
    await wait(10);
    expect(valueOf(textarea(host))).toBe('hello');
    expect(stored(local)).toBe('hello');
  });

  it('autosaves after the debounce and shows Saved', async () => {
    const { local, store } = setup();
    const { host } = mountTab(store);
    await wait(10);
    expect(host.querySelector('.notes-status')?.textContent).toBe('Saved');
    type(host, '# Hi');
    expect(host.querySelector('.notes-status')?.textContent).toBe('');
    await wait(100);
    expect(stored(local)).toBeUndefined();
    await wait(400);
    expect(stored(local)).toBe('# Hi');
    expect(host.querySelector('.notes-status')?.textContent).toBe('Saved');
  });

  it('flushes on blur', async () => {
    const { local, store } = setup();
    const { host } = mountTab(store);
    await wait(10);
    type(host, 'blur me');
    await act(async () => {
      textarea(host).dispatchEvent(new Event('blur'));
    });
    await wait(10);
    expect(stored(local)).toBe('blur me');
  });

  it('flushes when the tab is unmounted before the debounce', async () => {
    const { local, store } = setup();
    const { host, unmount } = mountTab(store);
    await wait(10);
    type(host, 'bye');
    unmount();
    await wait(10);
    expect(stored(local)).toBe('bye');
  });

  it('previews sanitized markdown and returns to edit mode', async () => {
    const { store } = setup();
    const { host } = mountTab(store);
    await wait(10);
    type(host, '# Title\n\n[a](https://a.test) <img src=x onerror="alert(1)">');
    act(() => button(host, 'Preview').click());
    await wait(100);
    const preview = host.querySelector('[data-testid="notes-preview"]') as HTMLElement;
    expect(preview.querySelector('h1')?.textContent).toBe('Title');
    expect(preview.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(preview.innerHTML).not.toContain('onerror');
    expect(textarea(host)).toBeNull();
    act(() => button(host, 'Edit').click());
    expect(textarea(host)).not.toBeNull();
  });

  it('keeps notes across a remount', async () => {
    const { local, store } = setup();
    const first = mountTab(store);
    await wait(10);
    type(first.host, 'persist me');
    act(() => button(first.host, 'Preview').click());
    await wait(10);
    first.unmount();

    const second = mountTab(createStore({ local, session: createFakeAdapter() }));
    await wait(10);
    expect(valueOf(textarea(second.host))).toBe('persist me');
  });

  it('adopts external changes when there are no local edits', async () => {
    const { local, store } = setup();
    const { host } = mountTab(store);
    await wait(10);
    await act(() => local.set('notes', { markdown: 'from elsewhere', updatedAt: 2 }));
    await wait(10);
    expect(valueOf(textarea(host))).toBe('from elsewhere');
  });

  it('does not overwrite unsaved local edits with external changes', async () => {
    const { local, store } = setup();
    const { host } = mountTab(store);
    await wait(10);
    type(host, 'mine');
    await act(() => local.set('notes', { markdown: 'theirs', updatedAt: 2 }));
    await wait(10);
    expect(valueOf(textarea(host))).toBe('mine');
  });
});
