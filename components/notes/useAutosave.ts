import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

export type SaveStatus = 'saved' | 'pending';

export const AUTOSAVE_DELAY_MS = 400;

export interface Autosave {
  status: SaveStatus;
  schedule(value: string): void;
  flush(): void;
}

export function useAutosave(
  save: (value: string) => Promise<void>,
  delay = AUTOSAVE_DELAY_MS,
): Autosave {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const pending = useRef<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const value = pending.current;
    if (value === undefined) return;
    pending.current = undefined;
    void saveRef.current(value).then(() => {
      if (pending.current === undefined) setStatus('saved');
    });
  }, []);

  const schedule = useCallback(
    (value: string) => {
      pending.current = value;
      setStatus('pending');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}
