// A client installs a PIE package and nothing else: no svelte to install, no svelte import to
// satisfy. This runs the publish-surface Svelte rules over the built workspace, so a lane that
// stops inlining Svelte fails its pull request; the release gate runs the same rules over npm's
// packed file list. Walking `files` covers what npm packs without an npm pack per package.
import { existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectSvelteLeakViolations } from '../scripts/check-publish-surface.mjs';
import {
  collectJsFiles,
  createPackageSnapshots,
  toPosix,
} from '../scripts/lib/package-inspection.mjs';

const REPO_ROOT = join(import.meta.dirname, '..');

function shippedJsFiles(dir: string, entries: string[] = []): string[] {
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    if (!existsSync(path)) return [];
    const files = statSync(path).isDirectory()
      ? collectJsFiles(path, { extensions: ['.js', '.mjs', '.cjs'] })
      : [path];
    return files.map((file) => toPosix(relative(dir, file)));
  });
}

describe('Svelte as an implementation detail', () => {
  it('no publishable package asks its client for svelte', () => {
    const packages = createPackageSnapshots({ root: REPO_ROOT }).map(
      ({ dir, relativeDir, pkg }) => ({
        dir,
        relativeDir,
        pkg,
        files: shippedJsFiles(dir, pkg.files),
      })
    );

    // Unbuilt, there is no dist to scan and every package would pass.
    expect(packages.some(({ files }) => files.some((file) => file.startsWith('dist/')))).toBe(true);
    expect(
      packages.flatMap(({ relativeDir, ...snapshot }) =>
        collectSvelteLeakViolations(snapshot).map((violation) => `${relativeDir}: ${violation}`)
      )
    ).toEqual([]);
  }, 60_000);
});
