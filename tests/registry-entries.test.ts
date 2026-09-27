import { describe, expect, it } from 'vitest';
import { fetchRegistryEntries } from '../scripts/lib/registry-entries.mjs';

const target = { name: '@pie-element/a', version: '1.0.0-next.1' };
const key = `${target.name}@${target.version}`;
const published = { versions: { [target.version]: { dist: { attestations: {} } } } };
const notFound = { error: 'Not found' };

/** A registry that answers each call from `bodies` in turn, and a clock that `sleep` advances. */
function stubRegistry(bodies: unknown[]) {
  let clock = 0;
  const calls: string[] = [];
  const fetchImpl = (async (url: string) => {
    calls.push(url);
    return new Response(JSON.stringify(bodies[Math.min(calls.length - 1, bodies.length - 1)]));
  }) as unknown as typeof fetch;
  return {
    calls,
    options: {
      registry: 'https://registry.test',
      fetchImpl,
      now: () => clock,
      sleep: async (ms: number) => {
        clock += ms;
      },
      log: () => {},
    },
  };
}

describe('fetchRegistryEntries', () => {
  it('reads a missing version once without a retry budget', async () => {
    const registry = stubRegistry([notFound, published]);
    const entries = await fetchRegistryEntries([target], registry.options);
    expect(entries.get(key)).toEqual({ reason: 'not on the registry at this version' });
    expect(registry.calls).toEqual(['https://registry.test/@pie-element%2Fa']);
  });

  it('retries a version the registry has not caught up with', async () => {
    const registry = stubRegistry([notFound, notFound, published]);
    const entries = await fetchRegistryEntries([target], { ...registry.options, retryMs: 60_000 });
    expect(entries.get(key)?.entry).toEqual(published.versions[target.version]);
    expect(registry.calls).toHaveLength(3);
  });

  it('reports what is still missing once the budget is spent', async () => {
    const registry = stubRegistry([notFound]);
    const entries = await fetchRegistryEntries([target], { ...registry.options, retryMs: 60_000 });
    expect(entries.get(key)).toEqual({
      reason: 'not on the registry at this version (still missing after 60s)',
    });
    // 5s, 10s, 20s fit in the budget; the next 40s wait would not.
    expect(registry.calls).toHaveLength(4);
  });

  it('refetches only the targets that were missing', async () => {
    const other = { name: '@pie-element/b', version: '2.0.0' };
    const registry = stubRegistry([{ versions: { [other.version]: {} } }, notFound, published]);
    const entries = await fetchRegistryEntries([other, target], {
      ...registry.options,
      retryMs: 60_000,
    });
    expect(entries.get('@pie-element/b@2.0.0')).toEqual({ entry: {} });
    expect(entries.get(key)?.entry).toBeDefined();
    expect(registry.calls).toEqual([
      'https://registry.test/@pie-element%2Fb',
      'https://registry.test/@pie-element%2Fa',
      'https://registry.test/@pie-element%2Fa',
    ]);
  });

  it('treats a failed fetch as missing', async () => {
    const entries = await fetchRegistryEntries([target], {
      fetchImpl: (async () => {
        throw new Error('offline');
      }) as unknown as typeof fetch,
    });
    expect(entries.get(key)).toEqual({ reason: 'registry fetch failed: offline' });
  });
});
