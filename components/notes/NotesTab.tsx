import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import './notes.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useNotes } from '../../lib/storage/hooks';
import type { Store } from '../../lib/storage/store';
import { useAutosave } from './useAutosave';

type Mode = 'edit' | 'preview';

interface NotesTabProps {
  store?: Store;
}

type Renderer = (source: string) => string;

export function NotesTab({ store }: NotesTabProps = {}) {
  const notes = useNotes(store);
  const [mode, setMode] = useState<Mode>('edit');
  const [draft, setDraft] = useState('');
  const [render, setRender] = useState<Renderer>();
  const latest = useRef('');
  const persisted = useRef('');

  const { status, schedule, flush } = useAutosave((markdown) => {
    persisted.current = markdown;
    return notes.set({ markdown, updatedAt: Date.now() });
  });

  useEffect(() => {
    if (!notes.ready || latest.current !== persisted.current) return;
    latest.current = persisted.current = notes.value.markdown;
    setDraft(notes.value.markdown);
  }, [notes.ready, notes.value.markdown]);

  useEffect(() => {
    if (mode !== 'preview' || render) return;
    let active = true;
    void import('../../lib/markdown').then(
      (module) => active && setRender(() => module.renderMarkdown),
    );
    return () => {
      active = false;
    };
  }, [mode, render]);

  const onInput = (event: Event) => {
    const value = (event.currentTarget as HTMLTextAreaElement).value;
    latest.current = value;
    setDraft(value);
    schedule(value);
  };

  const switchMode = (next: Mode) => {
    flush();
    setMode(next);
  };

  return (
    <section class="notes" aria-label="Notes">
      <div class="notes-toolbar">
        <wa-button
          size="small"
          appearance={mode === 'edit' ? 'filled' : 'plain'}
          onClick={() => switchMode('edit')}
        >
          Edit
        </wa-button>
        <wa-button
          size="small"
          appearance={mode === 'preview' ? 'filled' : 'plain'}
          onClick={() => switchMode('preview')}
        >
          Preview
        </wa-button>
        <span class="notes-status" role="status" aria-live="polite">
          {notes.ready && status === 'saved' ? 'Saved' : ''}
        </span>
      </div>
      {mode === 'edit' ? (
        <wa-textarea
          aria-label="Notes in markdown"
          placeholder="Write notes in markdown"
          resize="none"
          rows={16}
          value={draft}
          onInput={onInput}
          onBlur={flush}
        />
      ) : (
        <div
          class="notes-preview"
          data-testid="notes-preview"
          dangerouslySetInnerHTML={{ __html: render ? render(draft) : '' }}
        />
      )}
    </section>
  );
}
