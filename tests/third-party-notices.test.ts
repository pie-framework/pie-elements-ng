import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { build } from 'vite';
import { afterAll, describe, expect, it } from 'vitest';
import { collectConfigGaps, collectNoticeGaps } from '../scripts/check-third-party-notices.mjs';
import {
  installedPackageRoot,
  noticedPackageNames,
  thirdPartyLicenses,
  thirdPartyNotices,
} from '../tools/vite/third-party-licenses.ts';

// Outside node_modules: a fixture path holding `/node_modules/` would read as an installed package.
const roots: string[] = [];

afterAll(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'pie-third-party-notices-'));
  roots.push(root);
  for (const [name, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), text);
  }
  return root;
}

/** Writes the notices of installed fixture packages, as the plugin would, to `file`. */
async function writeNotices(root: string, file: string, packages: string[]): Promise<void> {
  const { text } = thirdPartyNotices(
    packages.map((name) => join(root, 'node_modules', name, 'index.js'))
  );
  await writeFile(join(root, file), text ?? '');
}

const INSTALLED = {
  'node_modules/licensed/package.json':
    '{"name":"licensed","version":"1.2.0","license":"Apache-2.0"}',
  'node_modules/licensed/LICENSE': 'Apache License text\n',
  'node_modules/licensed/NOTICE': 'Copyright Licensed Authors\n',
  'node_modules/licensed/index.js': 'export const licensed = () => "licensed";\n',
  'node_modules/@scope/bare/package.json':
    '{"name":"@scope/bare","version":"0.1.0","license":"MIT","author":{"name":"Bare Author"}}',
  'node_modules/@scope/bare/index.js': 'export const bare = () => "bare";\n',
};

async function buildFixture(entries: Record<string, string>): Promise<string> {
  const root = await fixture({
    ...INSTALLED,
    'package.json': '{"type":"module"}',
    'first.js': 'import { licensed } from "licensed";\nexport default licensed();\n',
    'second.js': 'import { bare } from "@scope/bare";\nexport default bare();\n',
    'own.js': 'export default "own";\n',
  });
  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [thirdPartyLicenses()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      lib: {
        entry: Object.fromEntries(
          Object.entries(entries).map(([name, file]) => [name, join(root, file)])
        ),
        formats: ['es'],
      },
    },
  });
  return root;
}

describe('third-party license notices plugin', () => {
  it('writes each bundled package with its license files, or its declared license when it ships none', async () => {
    const root = await buildFixture({ first: 'first.js', second: 'second.js' });
    const text = await readFile(join(root, 'dist', 'THIRD_PARTY_LICENSES.txt'), 'utf8');

    expect([...noticedPackageNames(text)]).toEqual(['@scope/bare', 'licensed']);
    expect(text).toContain('licensed@1.2.0\nLicense: Apache-2.0');
    expect(text).toContain('Apache License text\n\nCopyright Licensed Authors');
    expect(text).toContain(
      '@scope/bare ships no license file. Its package.json declares MIT and names Bare Author as author.'
    );
  });

  it('names the notices of a single-chunk build after its chunk', async () => {
    const root = await buildFixture({ first: 'first.js' });
    const text = await readFile(join(root, 'dist', 'first.THIRD_PARTY_LICENSES.txt'), 'utf8');

    expect([...noticedPackageNames(text)]).toEqual(['licensed']);
  });

  it('emits nothing for first-party code', async () => {
    const root = await buildFixture({ own: 'own.js' });

    await expect(
      readFile(join(root, 'dist', 'own.THIRD_PARTY_LICENSES.txt'), 'utf8')
    ).rejects.toThrow();
  });
});

describe('third-party notices from other builds', () => {
  it('finds the package an installed file belongs to', () => {
    expect(installedPackageRoot('/w/node_modules/.bun/x@1/node_modules/@a/b/lib/c.js')).toBe(
      '/w/node_modules/.bun/x@1/node_modules/@a/b'
    );
    expect(installedPackageRoot('/w/packages/a/src/index.ts')).toBeNull();
  });

  it('carries over the notices covering another workspace build, and reports vendored copies nothing covers', async () => {
    const root = await fixture({
      ...INSTALLED,
      'lib/package.json': '{"name":"lib"}',
      'lib/dist/index.js': 'export {};\n',
      'bare-lib/package.json': '{"name":"bare-lib"}',
      'bare-lib/dist/node_modules/.bun/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs': 'export {};\n',
    });
    await writeNotices(root, 'lib/dist/THIRD_PARTY_LICENSES.txt', ['licensed']);
    const covered = thirdPartyNotices([join(root, 'lib/dist/index.js')]);
    const vendored = join(
      root,
      'bare-lib/dist/node_modules/.bun/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs'
    );

    expect([...noticedPackageNames(covered.text ?? '')]).toEqual(['licensed']);
    expect(thirdPartyNotices([vendored]).unattributed).toEqual([vendored]);
  });
});

describe('check-third-party-notices', () => {
  const snapshot = (dir: string, packed: string[], scripts: Record<string, string> = {}) => ({
    dir,
    pkg: { name: 'fixture', scripts },
    packedFiles: new Set(packed),
  });

  it('reports a Vite build whose config lacks the plugin, and accepts one that extends a config using it', async () => {
    const root = await fixture({
      'tools/base.config.ts': 'export default { plugins: [thirdPartyLicenses()] };\n',
      'pkg/vite.config.ts': 'export default {};\n',
      'pkg/vite.config.browser.ts':
        "import base from '../tools/base.config.ts';\nexport default base;\n",
    });
    const pkg = snapshot(join(root, 'pkg'), [], {
      build: 'vite build && vite build --config vite.config.browser.ts && tsc',
    });

    expect(collectConfigGaps(pkg, { root })).toEqual([
      'pkg/vite.config.ts does not use thirdPartyLicenses()',
    ]);
  });

  it('requires a packed notices file naming every installed package a sourcemap shows bundled', async () => {
    const map = (sources: string[]) => JSON.stringify({ version: 3, sources, mappings: '' });
    const root = await fixture({
      ...INSTALLED,
      'pkg/package.json': '{"name":"fixture"}',
      'pkg/dist/browser/index.js': 'export {};\n',
      'pkg/dist/browser/index.js.map': map([
        '../../src/index.ts',
        '../../../node_modules/licensed/index.js',
        '../../../node_modules/@scope/bare/index.js',
      ]),
      'pkg/dist/index.iife.js': 'void 0;\n',
    });
    await writeNotices(root, 'pkg/dist/browser/THIRD_PARTY_LICENSES.txt', ['licensed']);
    const dir = join(root, 'pkg');
    const packed = ['dist/browser/index.js', 'dist/browser/index.js.map', 'dist/index.iife.js'];

    expect(collectNoticeGaps(snapshot(dir, packed))).toEqual([
      'dist/browser/index.js.map bundles @scope/bare, licensed and no packed notices file covers it',
      'dist/index.iife.js bundles its dependencies and no packed notices file covers it',
    ]);
    expect(
      collectNoticeGaps(snapshot(dir, [...packed, 'dist/browser/THIRD_PARTY_LICENSES.txt']))
    ).toEqual([
      'dist/browser/THIRD_PARTY_LICENSES.txt omits @scope/bare, bundled into dist/browser/index.js.map',
      'dist/index.iife.js bundles its dependencies and no packed notices file covers it',
    ]);
  });
});
