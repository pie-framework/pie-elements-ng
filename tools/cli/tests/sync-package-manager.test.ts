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

  it('adds known peer fallback deps for charting and styled packages', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');
    const upstreamElementDir = join(
      rootDir,
      'upstream',
      'pie-elements',
      'packages',
      'test-element'
    );

    await createElementBase(elementDir);
    await mkdir(upstreamElementDir, { recursive: true });
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          dependencies: {
            recharts: '^3.7.0',
            'styled-components': '^5.2.1',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensureElementPackageJson(
      'test-element',
      elementDir,
      createConfig(rootDir)
    );
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(elementDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).toMatchObject({
      recharts: '^3.7.0',
      'styled-components': '^5.2.1',
      'react-is': '^19.2.0',
    });
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

  it('maps legacy mathquill deps to shared math-engine workspace package', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'math-input');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'math-input');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(join(libDir, 'src', 'index.ts'), 'export {};\n', 'utf-8');
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/math-input',
          dependencies: {
            '@pie-framework/mathquill': '^1.0.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('math-input', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).toMatchObject({
      '@pie-element/shared-math-engine': 'workspace:*',
    });
    expect(pkgJson.dependencies['@pie-framework/mathquill']).toBeUndefined();
    expect(pkgJson.dependencies['@pie-element/shared-mathquill']).toBeUndefined();
  });

  it('adds known tiptap and testing-library peer fallback deps', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'test-utils');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'test-utils');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(
      join(libDir, 'src', 'index.ts'),
      `
      import userEvent from '@testing-library/user-event';
      import CharacterCount from '@tiptap/extension-character-count';
      import ListItem from '@tiptap/extension-list-item';
      export { userEvent, CharacterCount, ListItem };
      `,
      'utf-8'
    );
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/test-utils',
          dependencies: {
            '@testing-library/user-event': '^14.5.2',
            '@tiptap/extension-character-count': '3.0.9',
            '@tiptap/extension-list-item': '3.0.9',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('test-utils', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).toMatchObject({
      '@testing-library/user-event': '^14.5.2',
      '@testing-library/dom': '^10.4.1',
      '@tiptap/extension-character-count': '3.0.9',
      '@tiptap/extensions': '^3.20.0',
      '@tiptap/extension-list-item': '3.0.9',
      '@tiptap/extension-list': '3.0.9',
    });
  });
});
