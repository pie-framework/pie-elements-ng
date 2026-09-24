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
import { findWorkspacePackages } from '../src/workspace-packages.js';

function makeRepo(workspaces: string[], packages: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'pie-workspace-packages-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces }), 'utf8');
  for (const [dir, name] of Object.entries(packages)) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, 'package.json'), JSON.stringify({ name }), 'utf8');
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
