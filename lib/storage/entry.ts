import type { StorageAdapter } from './adapter';

export interface Entry<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
  update(change: (current: T) => T): Promise<void>;
  remove(): Promise<void>;
  subscribe(listener: (value: T) => void): () => void;
}

export function createEntry<T>(
  adapter: StorageAdapter,
  key: string,
  parse: (raw: unknown) => T,
  ready: Promise<void> = Promise.resolve(),
): Entry<T> {
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <R>(task: () => Promise<R>): Promise<R> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };
  const read = async () => {
    await ready;
    return parse(await adapter.get(key));
  };

  return {
    get: read,
    set: (value) => enqueue(() => ready.then(() => adapter.set(key, value))),
    update: (change) =>
      enqueue(async () => {
        const next = change(await read());
        await adapter.set(key, next);
      }),
    remove: () => enqueue(() => ready.then(() => adapter.remove([key]))),
    subscribe: (listener) =>
      adapter.subscribe((changes) => {
        if (key in changes) listener(parse(changes[key]));
      }),
  };
}
