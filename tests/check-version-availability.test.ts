import { describe, expect, it } from 'vitest';
import { classifyBump, compareVersions } from '../scripts/check-version-availability.mjs';

const LOCAL = { main: './dist/index.js' };

const packument = (latest: string, versions: Record<string, string>) => ({
  'dist-tags': { latest },
  versions: Object.fromEntries(Object.entries(versions).map(([v, main]) => [v, { main }])),
  time: {},
});

// Shaped like @pie-lib/render-ui on 2026-10-02: the legacy line is at 7.0.3 on `latest`, while
// this repo's develop holds 6.2.0-next.N.
const RENDER_UI = packument('7.0.3', {
  '6.1.0': 'lib/index.js',
  '7.0.0': 'lib/index.js',
  '7.0.3': 'lib/index.js',
});

describe('version availability', () => {
  it('orders versions by major, minor and patch, with a prerelease below its release', () => {
    expect(compareVersions('6.2.0', '7.0.3')).toBeLessThan(0);
    expect(compareVersions('8.0.0', '7.0.3')).toBeGreaterThan(0);
    expect(compareVersions('7.0.3', '7.0.3')).toBe(0);
    expect(compareVersions('7.0.3-next.1', '7.0.3')).toBeLessThan(0);
  });

  it('names a number another lineage already published', () => {
    expect(classifyBump({ ...LOCAL, version: '7.0.0' }, RENDER_UI)).toMatchObject({
      kind: 'taken-by-other-lineage',
      publishedMain: 'lib/index.js',
    });
  });

  // A free number is not enough: publishing it as `latest` would move the tag backwards.
  it('refuses a free stable version below latest', () => {
    expect(classifyBump({ ...LOCAL, version: '6.2.0' }, RENDER_UI)).toEqual({
      kind: 'below-latest',
      latest: '7.0.3',
      latestMain: 'lib/index.js',
    });
  });

  it('accepts a stable version above latest', () => {
    expect(classifyBump({ ...LOCAL, version: '8.0.0' }, RENDER_UI)).toBeNull();
  });

  // Prereleases publish under `next` and never touch `latest`.
  it('leaves a free prerelease below latest alone', () => {
    expect(classifyBump({ ...LOCAL, version: '6.2.0-next.20261002090000' }, RENDER_UI)).toBeNull();
  });

  it('accepts anything for a package npm has never seen', () => {
    expect(classifyBump({ ...LOCAL, version: '0.1.0' }, null)).toBeNull();
  });
});
