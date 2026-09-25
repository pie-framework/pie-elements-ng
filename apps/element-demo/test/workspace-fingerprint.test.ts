import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createWorkspaceCacheSaltForDependencies,
  workspaceBuildInputDirs,
} from '../src/lib/testing/workspace-fingerprint';

const roots: string[] = [];

function write(root: string, relative: string, content: string): void {
  mkdirSync(dirname(join(root, relative)), { recursive: true });
  writeFileSync(join(root, relative), content, 'utf8');
}

function makeWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'pie-workspace-fingerprint-'));
  roots.push(root);
  write(root, 'package.json', JSON.stringify({ workspaces: ['packages/*/*'] }));
  const packages: Record<string, object> = {
    'packages/elements-svelte/simple-cloze': {
      name: '@pie-element/simple-cloze',
      devDependencies: { '@pie-element/shared-player-events': 'workspace:*' },
    },
    'packages/shared/player-events': {
      name: '@pie-element/shared-player-events',
      dependencies: { '@pie-lib/translator': 'workspace:*' },
    },
    'packages/lib-svelte/translator': { name: '@pie-lib/translator' },
    'packages/lib-svelte/unrelated': { name: '@pie-lib/unrelated' },
    'packages/shared/bundler-shared': { name: '@pie-element/element-bundler' },
  };
  for (const [dir, manifest] of Object.entries(packages)) {
    write(root, join(dir, 'package.json'), JSON.stringify(manifest));
    write(root, join(dir, 'src', 'index.ts'), 'export {};\n');
  }
  write(root, 'packages/shared/bundler-shared/tests/index.test.ts', '// test\n');
  return root;
}

const dependencies = [{ name: '@pie-element/simple-cloze', version: 'workspace' }];

function saltOf(root: string): string {
  return createWorkspaceCacheSaltForDependencies({
    workspaceRoot: root,
    dependencies,
    requestedBundles: ['client-player'],
    resolutionMode: 'workspace-fast',
    sourceMaps: false,
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('workspaceBuildInputDirs', () => {
  it('covers the element wherever it lives, its dependency closure and the bundler sources', () => {
    const root = makeWorkspace();

    expect(workspaceBuildInputDirs(root, dependencies)).toEqual(
      [
        'packages/elements-svelte/simple-cloze',
        'packages/lib-svelte/translator',
        'packages/shared/bundler-shared/src',
        'packages/shared/player-events',
      ].map((dir) => join(root, dir))
    );
  });
});

describe('createWorkspaceCacheSaltForDependencies', () => {
  it.each([
    ['a transitive dependency', 'packages/lib-svelte/translator/src/index.ts'],
    ['a bundler source other than its entry', 'packages/shared/bundler-shared/src/installer.ts'],
    ['a file in a nested directory', 'packages/shared/player-events/src/nested/extra.ts'],
  ])('changes when %s changes', (_label, file) => {
    const root = makeWorkspace();
    const before = saltOf(root);

    write(root, file, 'export const changed = true;\n');

    expect(saltOf(root)).not.toBe(before);
  });

  it.each([
    ['a package outside the closure', 'packages/lib-svelte/unrelated/src/index.ts'],
    ['a bundler test', 'packages/shared/bundler-shared/tests/index.test.ts'],
    ['built output', 'packages/shared/player-events/dist/index.js'],
  ])('holds when %s changes', (_label, file) => {
    const root = makeWorkspace();
    const before = saltOf(root);

    write(root, file, 'export const changed = true;\n');

    expect(saltOf(root)).toBe(before);
  });
});
