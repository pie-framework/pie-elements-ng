import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Bundler, mkBundleCacheKey, mkDependencyHash } from '../src';
import type { BuildProgressEvent } from '../src/types';

describe('Bundler progress events', () => {
  const dirs: string[] = [];

  afterEach(() => {
    while (dirs.length) {
      const dir = dirs.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('emits queued and completed for cached builds', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'bundler-out-'));
    const cacheDir = mkdtempSync(join(tmpdir(), 'bundler-cache-'));
    dirs.push(outputDir, cacheDir);

    const deps = [{ name: '@pie-element/categorize', version: 'latest' }];
    const hash = mkDependencyHash(deps);
    const bundleDir = join(outputDir, hash);
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(bundleDir, 'player.js'), '// cached');
    writeFileSync(
      join(bundleDir, 'build-metadata.json'),
      JSON.stringify(
        {
          schemaVersion: 3,
          createdAt: new Date().toISOString(),
          builtBundles: ['player'],
        },
        null,
        2
      )
    );

    const events: BuildProgressEvent[] = [];
    const bundler = new Bundler(outputDir, cacheDir);
    const result = await bundler.build(
      { dependencies: deps, options: { requestedBundles: ['player'] } },
      (e) => events.push(e)
    );

    expect(result.success).toBe(true);
    expect(result.cached).toBe(true);
    expect(events[0]?.stage).toBe('queued');
    expect(events[events.length - 1]?.stage).toBe('completed');
  });

  it('uses cacheSalt as part of cache key resolution', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'bundler-out-'));
    const cacheDir = mkdtempSync(join(tmpdir(), 'bundler-cache-'));
    dirs.push(outputDir, cacheDir);

    const deps = [{ name: '@pie-element/categorize', version: 'latest' }];
    const cacheSalt = 'workspace-v1-abc123';
    const hash = mkBundleCacheKey(deps, cacheSalt);
    const bundleDir = join(outputDir, hash);
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(bundleDir, 'player.js'), '// cached with salt');
    writeFileSync(
      join(bundleDir, 'build-metadata.json'),
      JSON.stringify(
        {
          schemaVersion: 3,
          createdAt: new Date().toISOString(),
          builtBundles: ['player'],
        },
        null,
        2
      )
    );

    const events: BuildProgressEvent[] = [];
    const bundler = new Bundler(outputDir, cacheDir);
    const result = await bundler.build(
      {
        dependencies: deps,
        options: { requestedBundles: ['player'], cacheSalt },
      },
      (e) => events.push(e)
    );

    expect(result.success).toBe(true);
    expect(result.cached).toBe(true);
    expect(result.hash).toBe(hash);
    expect(result.hash).not.toBe(mkDependencyHash(deps));
    expect(events[0]?.stage).toBe('queued');
    expect(events[events.length - 1]?.stage).toBe('completed');
  });
});
