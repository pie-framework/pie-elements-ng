import { readFileSync, rmSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { globSync } from 'glob';
import { afterAll, describe, expect, it } from 'vitest';
import { namedDependencies, planTypeChecks, typeCheckArgs } from '../scripts/type-check-staged.mjs';

const REPO_ROOT = join(import.meta.dirname, '..');

const tempDirs: string[] = [];
afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

describe('pre-commit type check', () => {
  it('runs each tsc step of a build with --noEmit, from the repository root', () => {
    expect(
      typeCheckArgs('rm -rf dist && vite build && bun x tsc --emitDeclarationOnly', 'p/a')
    ).toEqual([['-p', 'p/a', '--noEmit']]);
    expect(
      typeCheckArgs('tsc --emitDeclarationOnly && tsc -p tsconfig.browser.json', 'p/a')
    ).toEqual([
      ['-p', 'p/a', '--noEmit'],
      ['-p', 'p/a/tsconfig.browser.json', '--noEmit'],
    ]);
    expect(typeCheckArgs('vite build', 'p/a')).toEqual([]);
  });

  // A build step the parser misses would leave its package unchecked without a word.
  it('replays every tsc step of every package build', () => {
    const manifests = globSync(
      ['packages/*/package.json', 'packages/*/*/package.json', 'tools/*/package.json'],
      { cwd: REPO_ROOT, ignore: '**/node_modules/**' }
    );
    expect(manifests.length).toBeGreaterThan(0);
    for (const manifest of manifests) {
      const build: string =
        JSON.parse(readFileSync(join(REPO_ROOT, manifest), 'utf8')).scripts?.build ?? '';
      expect(typeCheckArgs(build, dirname(manifest)), manifest).toHaveLength(
        build.match(/\btsc\b/g)?.length ?? 0
      );
    }
  });

  it('checks each package once and reports the staged files no build type-checks', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pie-type-check-staged-'));
    tempDirs.push(root);
    const writeManifest = async (dir: string, manifest: object) => {
      await mkdir(join(root, dir), { recursive: true });
      await writeFile(join(root, dir, 'package.json'), JSON.stringify(manifest));
    };
    await writeManifest('packages/a', {
      name: '@x/a',
      scripts: { build: 'vite build && tsc --emitDeclarationOnly' },
      dependencies: { '@x/b': 'workspace:*', react: '^18.2.0' },
    });
    await writeManifest('apps/web', { name: 'web', scripts: { build: 'vite build' } });

    expect(
      planTypeChecks(
        [
          'packages/a/src/one.ts',
          'packages/a/src/two.tsx',
          'packages/a/README.md',
          'apps/web/src/main.ts',
          'vitest.config.ts',
        ],
        root
      )
    ).toEqual({
      checks: [
        { name: '@x/a', args: ['-p', 'packages/a', '--noEmit'], workspaceDependencies: ['@x/b'] },
      ],
      unchecked: ['apps/web', 'vitest.config.ts'],
    });
  });

  it('names the workspace dependencies a tsc report mentions', () => {
    const dependencies = ['@pie-lib/graphing', '@pie-lib/graphing-utils', '@pie-lib/translator'];
    expect(
      namedDependencies(
        "src/i18n.ts(1,24): error TS2307: Cannot find module '@pie-lib/translator' or its corresponding type declarations.\n" +
          `src/plot.ts(2,10): error TS2305: Module '"@pie-lib/graphing-utils"' has no exported member 'x'.\n`,
        dependencies
      )
    ).toEqual(['@pie-lib/graphing-utils', '@pie-lib/translator']);
    expect(
      namedDependencies(
        "src/a.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
        dependencies
      )
    ).toEqual([]);
  });
});
