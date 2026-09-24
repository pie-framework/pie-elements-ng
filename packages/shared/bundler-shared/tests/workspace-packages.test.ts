import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { linkWorkspacePackages } from '../src/installer.js';
import { findWorkspacePackages, workspaceDependencyClosure } from '../src/workspace-packages.js';

type Manifest = { name: string } & Record<string, unknown>;

function makeRepo(workspaces: string[], packages: Record<string, string | Manifest>): string {
  const root = mkdtempSync(join(tmpdir(), 'pie-workspace-packages-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces }), 'utf8');
  for (const [dir, manifest] of Object.entries(packages)) {
    mkdirSync(join(root, dir), { recursive: true });
    const content = typeof manifest === 'string' ? { name: manifest } : manifest;
    writeFileSync(join(root, dir, 'package.json'), JSON.stringify(content), 'utf8');
  }
  return root;
}

describe('findWorkspacePackages', () => {
  it('identifies packages by name, so folders sharing a basename stay distinct', () => {
    const root = makeRepo(['packages/lib-react/*', 'packages/lib-svelte/*'], {
      'packages/lib-react/config-ui': '@pie-lib/config-ui',
      'packages/lib-svelte/config-ui': '@pie-lib/config-ui-svelte',
    });

    expect(findWorkspacePackages(root)).toEqual([
      { name: '@pie-lib/config-ui', dir: join(root, 'packages/lib-react/config-ui') },
      { name: '@pie-lib/config-ui-svelte', dir: join(root, 'packages/lib-svelte/config-ui') },
    ]);
  });

  it('expands nested patterns and skips packages outside the PIE scopes', () => {
    const root = makeRepo(['packages/elements-react/*/demo', 'apps/*'], {
      'packages/elements-react/hotspot/demo': '@pie-element/hotspot-demo',
      'apps/esm-player-test': 'esm-player-test',
    });

    expect(findWorkspacePackages(root).map((pkg) => pkg.name)).toEqual([
      '@pie-element/hotspot-demo',
    ]);
  });

  it('rejects a package name declared by two directories', () => {
    const root = makeRepo(['packages/*'], {
      'packages/a': '@pie-lib/same',
      'packages/b': '@pie-lib/same',
    });

    expect(() => findWorkspacePackages(root)).toThrow(/@pie-lib\/same is declared twice/);
  });
});

describe('workspaceDependencyClosure', () => {
  const closureOf = (root: string, names: string[]) =>
    workspaceDependencyClosure(findWorkspacePackages(root), names).map((pkg) => pkg.name);

  it('follows the libraries a Svelte element inlines, wherever each package lives', () => {
    const root = makeRepo(
      ['packages/elements-svelte/*', 'packages/shared/*', 'packages/lib-svelte/*'],
      {
        'packages/elements-svelte/simple-cloze': {
          name: '@pie-element/simple-cloze',
          devDependencies: { '@pie-lib/delivery-events-svelte': 'workspace:*', svelte: '^5.0.0' },
        },
        'packages/lib-svelte/delivery-events': {
          name: '@pie-lib/delivery-events-svelte',
          dependencies: { '@pie-element/shared-player-events': '^1.0.0' },
        },
        'packages/shared/player-events': '@pie-element/shared-player-events',
        'packages/lib-svelte/unrelated': '@pie-lib/unrelated',
      }
    );

    expect(closureOf(root, ['@pie-element/simple-cloze'])).toEqual([
      '@pie-element/shared-player-events',
      '@pie-element/simple-cloze',
      '@pie-lib/delivery-events-svelte',
    ]);
  });

  it('follows peer and optional dependencies', () => {
    const root = makeRepo(['packages/*'], {
      'packages/element': {
        name: '@pie-element/element',
        peerDependencies: { '@pie-lib/peer': 'workspace:*' },
        optionalDependencies: { '@pie-lib/optional': 'workspace:*' },
      },
      'packages/peer': '@pie-lib/peer',
      'packages/optional': '@pie-lib/optional',
    });

    expect(closureOf(root, ['@pie-element/element'])).toEqual([
      '@pie-element/element',
      '@pie-lib/optional',
      '@pie-lib/peer',
    ]);
  });

  it('terminates on a dependency cycle and ignores names outside the workspace', () => {
    const root = makeRepo(['packages/*'], {
      'packages/a': { name: '@pie-lib/a', dependencies: { '@pie-lib/b': 'workspace:*' } },
      'packages/b': { name: '@pie-lib/b', dependencies: { '@pie-lib/a': 'workspace:*' } },
    });

    expect(closureOf(root, ['@pie-lib/a', '@pie-element/from-registry'])).toEqual([
      '@pie-lib/a',
      '@pie-lib/b',
    ]);
  });
});

describe('linkWorkspacePackages', () => {
  it('links each package under its package name', () => {
    const root = makeRepo(['packages/shared/*'], {
      'packages/shared/translator': '@pie-lib/translator',
      'packages/shared/lodash': '@pie-element/shared-lodash',
    });
    const nodeModules = join(root, 'bundle', 'node_modules');

    linkWorkspacePackages(root, nodeModules);

    expect(realpathSync(join(nodeModules, '@pie-lib/translator'))).toBe(
      realpathSync(join(root, 'packages/shared/translator'))
    );
    expect(realpathSync(join(nodeModules, '@pie-element/shared-lodash'))).toBe(
      realpathSync(join(root, 'packages/shared/lodash'))
    );
  });

  it('replaces a scope mirrored from the root install without writing into it', () => {
    const root = makeRepo(['packages/*'], { 'packages/render-ui': '@pie-lib/render-ui' });
    const rootScope = join(root, 'node_modules', '@pie-lib');
    mkdirSync(join(rootScope, 'from-registry'), { recursive: true });
    const nodeModules = join(root, 'bundle', 'node_modules');
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(rootScope, join(nodeModules, '@pie-lib'), 'dir');

    linkWorkspacePackages(root, nodeModules);

    expect(lstatSync(join(nodeModules, '@pie-lib')).isSymbolicLink()).toBe(false);
    expect(existsSync(join(nodeModules, '@pie-lib', 'from-registry'))).toBe(true);
    expect(existsSync(join(nodeModules, '@pie-lib', 'render-ui', 'package.json'))).toBe(true);
    expect(readdirSync(rootScope)).toEqual(['from-registry']);
  });
});
