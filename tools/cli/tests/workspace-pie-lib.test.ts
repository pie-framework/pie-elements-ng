import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES } from '../src/lib/upstream/sync-constants.js';
import { findWorkspacePieLibPackages } from '../src/lib/upstream/workspace-pie-lib.js';

async function writePackage(root: string, dir: string, name: string): Promise<void> {
  await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, dir, 'package.json'), JSON.stringify({ name }));
}

describe('findWorkspacePieLibPackages', () => {
  it('finds @pie-lib packages by manifest name wherever they live', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pie-cli-workspace-pie-lib-'));
    await writePackage(root, 'packages/lib-react/render-ui', '@pie-lib/render-ui');
    await writePackage(
      root,
      'packages/lib-svelte/delivery-events',
      '@pie-lib/delivery-events-svelte'
    );
    await writePackage(root, 'packages/shared/translator', '@pie-lib/translator');
    await writePackage(root, 'packages/shared/lodash', '@pie-element/shared-lodash');

    const packages = findWorkspacePieLibPackages(root);

    expect([...packages.keys()].sort()).toEqual([
      'delivery-events-svelte',
      'render-ui',
      'translator',
    ]);
    expect(packages.get('translator')).toBe(join(root, 'packages/shared/translator'));
  });
});

describe('upstream pie-lib sync', () => {
  it('leaves the locally owned translator alone', () => {
    expect(EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES).toContain('translator');
  });
});
