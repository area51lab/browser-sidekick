import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, SCHEMA_VERSION_KEY, migrate } from '../../lib/storage/schema';
import { createFakeAdapter } from '../helpers/fakeStorage';

describe('migrate', () => {
  it('stamps the version on a fresh install', async () => {
    const adapter = createFakeAdapter();
    await migrate(adapter);
    expect(adapter.data[SCHEMA_VERSION_KEY]).toBe(SCHEMA_VERSION);
  });

  it('does nothing when already current', async () => {
    const adapter = createFakeAdapter({ [SCHEMA_VERSION_KEY]: 1, sites: [] });
    let calls = 0;
    await migrate(adapter, { 1: (s) => (calls++, s) }, 1);
    expect(calls).toBe(0);
  });

  it('runs migrations in order, replacing and removing keys', async () => {
    const adapter = createFakeAdapter({ [SCHEMA_VERSION_KEY]: 1, old: 1, keep: 'k' });
    await migrate(
      adapter,
      {
        1: ({ old, ...rest }) => ({ ...rest, renamed: old }),
        2: (s) => ({ ...s, added: true }),
      },
      3,
    );
    expect(adapter.data).toEqual({ [SCHEMA_VERSION_KEY]: 3, keep: 'k', renamed: 1, added: true });
  });

  it('skips missing steps and leaves unversioned data intact', async () => {
    const stepless = createFakeAdapter({ [SCHEMA_VERSION_KEY]: 1, a: 1 });
    await migrate(stepless, {}, 2);
    expect(stepless.data).toEqual({ [SCHEMA_VERSION_KEY]: 2, a: 1 });

    const legacy = createFakeAdapter({ a: 1 });
    await migrate(legacy, { 1: () => ({}) }, 2);
    expect(legacy.data).toEqual({ [SCHEMA_VERSION_KEY]: 2, a: 1 });
  });
});
