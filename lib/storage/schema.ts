import type { StorageAdapter } from './adapter';

export const SCHEMA_VERSION = 1;
export const SCHEMA_VERSION_KEY = 'schemaVersion';

export type Snapshot = Record<string, unknown>;
export type Migration = (snapshot: Snapshot) => Snapshot;

/** Migrations indexed by the version they upgrade from: `MIGRATIONS[1]` upgrades v1 to v2. */
export const MIGRATIONS: Record<number, Migration> = {};

async function replaceAll(adapter: StorageAdapter, before: Snapshot, after: Snapshot) {
  const removed = Object.keys(before).filter((key) => !(key in after));
  if (removed.length > 0) await adapter.remove(removed);
  await Promise.all(Object.entries(after).map(([key, value]) => adapter.set(key, value)));
}

export async function migrate(
  adapter: StorageAdapter,
  migrations: Record<number, Migration> = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): Promise<void> {
  const stored = await adapter.get(SCHEMA_VERSION_KEY);
  if (stored === target) return;

  if (typeof stored === 'number' && stored < target) {
    const before = await adapter.getAll();
    let after = before;
    for (let version = stored; version < target; version++) {
      after = migrations[version]?.(after) ?? after;
    }
    await replaceAll(adapter, before, after);
  }
  await adapter.set(SCHEMA_VERSION_KEY, target);
}
