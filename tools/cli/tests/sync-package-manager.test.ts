import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { SCRIPTS } from '../src/lib/upstream/sync-constants.js';
import {
  ensureElementPackageJson,
  ensurePieLibPackageJson,
} from '../src/lib/upstream/sync-package-manager.js';

const createConfig = (rootDir: string) =>
  ({
    pieElements: join(rootDir, 'upstream', 'pie-elements'),
    pieLib: join(rootDir, 'upstream', 'pie-lib'),
    pieElementsNg: rootDir,
    syncControllers: true,
    syncReactComponents: true,
    syncPieLib: true,
    skipDemos: true,
    upstreamCommit: 'test',
  }) as any;

const createElementBase = async (elementDir: string) => {
  await mkdir(join(elementDir, 'src'), { recursive: true });
  await writeFile(
    join(elementDir, 'src', 'index.ts'),
    'export default class TestElement {}\n',
    'utf-8'
  );
};

const readBuildScript = async (elementDir: string): Promise<string> => {
  const pkgJson = JSON.parse(await readFile(join(elementDir, 'package.json'), 'utf-8'));
  return pkgJson.scripts.build;
};

describe('ensureElementPackageJson iife build script generation', () => {
  it('uses IIFE build script when vite.config.iife.ts exists', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await createElementBase(elementDir);
    await writeFile(join(elementDir, 'vite.config.iife.ts'), 'export default {};\n', 'utf-8');

    const changed = await ensureElementPackageJson(
      'test-element',
      elementDir,
      createConfig(rootDir)
    );
    expect(changed).toBe(true);

    const buildScript = await readBuildScript(elementDir);
    expect(buildScript).toBe(SCRIPTS.BUILD_WITH_IIFE);
  });

  it('uses standard build script when no IIFE files exist', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await createElementBase(elementDir);

    const changed = await ensureElementPackageJson(
      'test-element',
      elementDir,
      createConfig(rootDir)
    );
    expect(changed).toBe(true);

    const buildScript = await readBuildScript(elementDir);
    expect(buildScript).toBe(SCRIPTS.BUILD);
  });
});

describe('ensurePieLibPackageJson', () => {
  it('pins math-rendering to shared mathjax adapter workspace package', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'math-rendering');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await writeFile(join(libDir, 'src', 'index.ts'), 'export {};\n', 'utf-8');

    const changed = await ensurePieLibPackageJson('math-rendering', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).toEqual({
      '@pie-element/shared-math-rendering-mathjax': 'workspace:*',
    });
  });

  it('adds workspace deps detected from pie-lib source imports', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'math-input');
    const renderUiDir = join(rootDir, 'packages', 'lib-react', 'render-ui');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(renderUiDir, { recursive: true });
    await writeFile(
      join(libDir, 'src', 'index.ts'),
      "import { color } from '@pie-lib/render-ui';\nexport { color };\n",
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('math-input', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).toMatchObject({
      '@pie-lib/render-ui': 'workspace:*',
    });
  });
});
