import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { afterAll, describe, expect, it } from 'vitest';
import { readPackageIdentityExport } from '../scripts/check-publish-surface.mjs';
import { browserPackageIdentity } from '../tools/vite/browser-package-identity.ts';

const IDENTITY = { name: '@pie-element/fixture', version: '1.2.3' };

// Under node_modules so that Node's own loader imports the built entries: Vitest's module runner
// cannot import files created after it started.
const FIXTURES = join(process.cwd(), 'node_modules', '.cache', 'pie-browser-package-identity');

afterAll(async () => {
  await rm(FIXTURES, { recursive: true, force: true });
});

async function buildEntries(): Promise<string> {
  await mkdir(FIXTURES, { recursive: true });
  const root = await mkdtemp(join(FIXTURES, 'fixture-'));
  const files = {
    'package.json': '{"type":"module"}',
    'shared.js': 'export const shared = "shared";\n',
    'delivery.js': 'import { shared } from "./shared.js";\nexport default shared + "delivery";\n',
    'controller.js': 'import { shared } from "./shared.js";\nexport const model = () => shared;\n',
  };
  for (const [name, source] of Object.entries(files)) await writeFile(join(root, name), source);
  const entries = { delivery: join(root, 'delivery.js'), controller: join(root, 'controller.js') };
  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [browserPackageIdentity(IDENTITY, Object.values(entries))],
    build: { outDir: 'dist', emptyOutDir: true, lib: { entry: entries, formats: ['es'] } },
  });
  return join(root, 'dist');
}

describe('browser package identity', () => {
  it('stamps each entry with a frozen identity the publish check reads back', async () => {
    const dist = await buildEntries();

    for (const entry of ['delivery.js', 'controller.js']) {
      const source = await readFile(join(dist, entry), 'utf8');
      expect(readPackageIdentityExport(source)).toEqual(IDENTITY);
      const module = await import(/* @vite-ignore */ pathToFileURL(join(dist, entry)).href);
      expect(module.piePackage).toEqual(IDENTITY);
      expect(Object.isFrozen(module.piePackage)).toBe(true);
    }
  });

  it('leaves modules other than the entries alone', () => {
    const plugin = browserPackageIdentity(IDENTITY, ['/pkg/src/delivery/index.ts']);
    const transform = plugin.transform as (code: string, id: string) => unknown;

    expect(transform('export default 1;\n', '/pkg/src/delivery/index.ts?used')).toMatchObject({
      code: expect.stringContaining('export const piePackage = Object.freeze('),
    });
    expect(transform('export default 1;\n', '/pkg/src/delivery/view.ts')).toBeNull();
  });

  it('reports a missing or non-literal identity', () => {
    expect(readPackageIdentityExport('export default 1;\n')).toBeUndefined();
    expect(readPackageIdentityExport('const a = make();\nexport { a as piePackage };\n')).toEqual(
      {}
    );
    expect(
      readPackageIdentityExport('export const piePackage = { name: "@x/y", version: 1 };\n')
    ).toEqual({});
  });
});
