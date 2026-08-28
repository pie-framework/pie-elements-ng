import { existsSync } from 'node:fs';
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

const writeBrowserEsmPolicy = async (rootDir: string) => {
  await mkdir(join(rootDir, 'tools', 'vite'), { recursive: true });
  await writeFile(
    join(rootDir, 'tools', 'vite', 'browser-esm-policy.json'),
    JSON.stringify(
      {
        allowedBareImports: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
        sharedDependencyVersions: {
          react: '18.2.0',
          'react-dom': '18.2.0',
        },
        maxBrowserJsBytesPerPackage: 4194304,
      },
      null,
      2
    ),
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
            '@visx/curve': '^3.0.0',
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
      recharts: '^3.8.1',
      'styled-components': '^5.2.1',
      'react-is': '^18.3.1',
      'd3-shape': '^3.2.0',
    });
  });

  it('does not promote optional transitive peer deps into element package dependencies', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');
    const upstreamElementDir = join(
      rootDir,
      'upstream',
      'pie-elements',
      'packages',
      'test-element'
    );
    const fakeDepDir = join(rootDir, 'node_modules', 'uses-optional-peer');

    await createElementBase(elementDir);
    await mkdir(upstreamElementDir, { recursive: true });
    await mkdir(fakeDepDir, { recursive: true });
    await writeFile(join(fakeDepDir, 'index.js'), 'export {};\n', 'utf-8');
    await writeFile(
      join(fakeDepDir, 'package.json'),
      JSON.stringify(
        {
          name: 'uses-optional-peer',
          version: '1.0.0',
          main: './index.js',
          peerDependencies: {
            'required-peer': '^2.0.0',
            'optional-peer': '^3.0.0',
            react: '^18.0.0',
          },
          peerDependenciesMeta: {
            'optional-peer': {
              optional: true,
            },
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          dependencies: {
            'uses-optional-peer': '^1.0.0',
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
      'uses-optional-peer': '^1.0.0',
      'required-peer': '^2.0.0',
    });
    expect(pkgJson.dependencies).not.toHaveProperty('optional-peer');
    expect(pkgJson.dependencies).not.toHaveProperty('react');
  });

  it('does not promote legacy Emotion peers into element package dependencies', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');
    const upstreamElementDir = join(
      rootDir,
      'upstream',
      'pie-elements',
      'packages',
      'test-element'
    );
    const fakeEmotionStyleDir = join(rootDir, 'node_modules', '@emotion', 'style');

    await createElementBase(elementDir);
    await mkdir(upstreamElementDir, { recursive: true });
    await mkdir(fakeEmotionStyleDir, { recursive: true });
    await writeFile(join(fakeEmotionStyleDir, 'index.js'), 'export {};\n', 'utf-8');
    await writeFile(
      join(fakeEmotionStyleDir, 'package.json'),
      JSON.stringify(
        {
          name: '@emotion/style',
          version: '0.8.0',
          main: './index.js',
          peerDependencies: {
            '@emotion/core': '0.x.x',
            react: '>=16.3.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          dependencies: {
            '@emotion/style': '^0.8.0',
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
      '@emotion/style': '^0.8.0',
    });
    expect(pkgJson.dependencies).not.toHaveProperty('@emotion/core');
  });

  it('declares third-party packages detected from transformed element source imports', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');
    const upstreamElementDir = join(
      rootDir,
      'upstream',
      'pie-elements',
      'packages',
      'test-element'
    );
    const fakeDebugDir = join(rootDir, 'node_modules', 'debug');
    const fakeSharedLodashDir = join(rootDir, 'node_modules', '@pie-element', 'shared-lodash');

    await createElementBase(elementDir);
    await mkdir(fakeDebugDir, { recursive: true });
    await mkdir(fakeSharedLodashDir, { recursive: true });
    await writeFile(
      join(fakeDebugDir, 'index.js'),
      'export default function debug() {}\n',
      'utf-8'
    );
    await writeFile(
      join(fakeSharedLodashDir, 'index.js'),
      'export const isEmpty = () => false;\n',
      'utf-8'
    );
    await writeFile(
      join(fakeDebugDir, 'package.json'),
      JSON.stringify(
        {
          name: 'debug',
          version: '4.4.3',
          main: './index.js',
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(fakeSharedLodashDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/shared-lodash',
          version: '0.1.0',
          main: './index.js',
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(elementDir, 'src', 'index.ts'),
      "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport debug from 'debug';\nimport { isEmpty } from '@pie-element/shared-lodash';\nexport { React, createRoot, debug, isEmpty };\n",
      'utf-8'
    );
    await mkdir(upstreamElementDir, { recursive: true });
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          dependencies: {},
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
    expect(pkgJson.dependencies.debug).toBe('^4.4.3');
    expect(pkgJson.dependencies['@pie-element/shared-lodash']).toBe('workspace:*');
    expect(pkgJson.dependencies).not.toHaveProperty('react');
    expect(pkgJson.dependencies).not.toHaveProperty('react-dom');
    expect(pkgJson.dependencies).not.toHaveProperty('lodash-es');
  });

  it('preserves local element versions and applies the browser ESM dependency policy', async () => {
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
      join(elementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          version: '13.1.2-next.0',
          peerDependencies: {
            react: '^16.8.0 || ^17.0.0',
            'react-dom': '^16.8.0 || ^17.0.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          version: '1.0.0',
          dependencies: {
            classnames: '^2.2.6',
            lodash: '^4.17.21',
            mathjs: '^7.5.1',
            react: '^16.8.0',
            'react-dom': '^16.8.0',
            'react-draggable': '^3.3.0',
            'react-is': '^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0',
            'react-redux': '^6.0.0',
            recharts: '^2.15.4',
            redux: '^4.0.1',
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
    expect(pkgJson.version).toBe('13.1.2-next.0');
    expect(pkgJson.peerDependencies).toEqual({
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    });
    expect(pkgJson.dependencies).toMatchObject({
      '@pie-element/shared-lodash': 'workspace:*',
      clsx: '^2.1.1',
      mathjs: '^15.2.0',
      'react-draggable': '^4.6.0',
      'react-is': '^18.3.1',
      'react-redux': '^9.3.0',
      recharts: '^3.8.1',
      redux: '^5.0.1',
    });
    expect(pkgJson.dependencies).not.toHaveProperty('classnames');
    expect(pkgJson.dependencies).not.toHaveProperty('lodash');
    expect(pkgJson.dependencies).not.toHaveProperty('lodash-es');
    // Upstream's own React ranges are dropped. React is re-added as an
    // installable pin only when tools/vite/browser-esm-policy.json supplies the
    // shared version, which this fixture deliberately omits - see the next test.
    expect(pkgJson.dependencies).not.toHaveProperty('react');
    expect(pkgJson.dependencies).not.toHaveProperty('react-dom');
  });

  it('pins shared React runtime deps as installable dependencies, not peers alone', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await writeBrowserEsmPolicy(rootDir);
    await createElementBase(elementDir);
    await writeFile(
      join(elementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          version: '13.1.2-next.0',
          peerDependencies: {
            react: '^16.8.0 || ^17.0.0',
            'react-dom': '^16.8.0 || ^17.0.0',
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

    // Legacy webpack bundlers install `dependencies` and never peers, so a
    // peer-only declaration leaves node_modules/react absent and every
    // @mui / @emotion / @dnd-kit peer fails to resolve. A caret range, not an exact
    // pin: an exact pin installs a second React copy and breaks hooks.
    expect(pkgJson.dependencies.react).toBe('^18.2.0');
    expect(pkgJson.dependencies['react-dom']).toBe('^18.2.0');

    // The peer declaration is still the compatibility contract for ESM hosts
    // that provide React themselves via an import map.
    expect(pkgJson.peerDependencies).toEqual({
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    });
  });

  it('removes development export conditions and emits the controller package contract', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await writeBrowserEsmPolicy(rootDir);
    await createElementBase(elementDir);
    await mkdir(join(elementDir, 'src', 'delivery'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'delivery', 'index.ts'),
      'export default class DeliveryElement {}\n',
      'utf-8'
    );
    await mkdir(join(elementDir, 'src', 'controller'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'controller', 'index.ts'),
      'export default class Controller {}\n',
      'utf-8'
    );
    await writeFile(
      join(elementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          exports: {
            '.': {
              development: './src/index.ts',
              types: './dist/index.d.ts',
              default: './dist/index.js',
            },
            './controller': {
              development: './src/controller/index.ts',
              types: './dist/controller/index.d.ts',
              default: './dist/controller/index.js',
            },
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
      createConfig(rootDir),
      { includeBrowserExports: true }
    );
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(elementDir, 'package.json'), 'utf-8'));
    expect(pkgJson.exports['.']).toEqual({
      types: './dist/index.d.ts',
      default: './dist/index.js',
    });
    expect(pkgJson.pie.controller).toBe('@pie-element/test-element/controller');
    expect(pkgJson.pie.browserSharedDependencies).toEqual({
      react: '18.2.0',
      'react-dom': '18.2.0',
    });
    expect(pkgJson.exports['./controller']).toEqual({
      types: './dist/controller/index.d.ts',
      default: './dist/controller/index.js',
    });
    expect(pkgJson.exports['./controller.js']).toEqual({
      types: './dist/controller/index.d.ts',
      default: './dist/controller/index.js',
    });
    expect(pkgJson.exports['./browser/delivery']).toEqual({
      default: './dist/browser/delivery/index.js',
    });
    expect(pkgJson.exports['./browser/controller']).toEqual({
      default: './dist/browser/controller/index.js',
    });
    expect(pkgJson.files).toContain('dist');
    expect(pkgJson.files).toContain('controller.js');
    expect(pkgJson.files).not.toContain('src');
    expect(pkgJson.scripts.build).toContain(
      'vite build --config ../../../tools/vite/element-browser.config.ts'
    );
    await expect(readFile(join(elementDir, 'controller.js'), 'utf-8')).resolves.toBe(
      "export * from './dist/controller/index.js';\n"
    );
  });

  it('generates runtime-support metadata for browser ESM element packages', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await writeBrowserEsmPolicy(rootDir);
    await createElementBase(elementDir);
    await mkdir(join(elementDir, 'src', 'delivery'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'delivery', 'index.ts'),
      'export default class DeliveryElement {}\n',
      'utf-8'
    );
    await mkdir(join(elementDir, 'src', 'author'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'author', 'index.ts'),
      'export default class AuthorElement {}\n',
      'utf-8'
    );
    await mkdir(join(elementDir, 'src', 'controller'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'controller', 'index.ts'),
      'export default class Controller {}\n',
      'utf-8'
    );
    await mkdir(join(elementDir, 'src', 'print'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'print', 'index.ts'),
      'export default class PrintElement {}\n',
      'utf-8'
    );

    const changed = await ensureElementPackageJson(
      'test-element',
      elementDir,
      createConfig(rootDir),
      { includeBrowserExports: true }
    );

    expect(changed).toBe(true);
    const runtimeSupport = await readFile(join(elementDir, 'src', 'runtime-support.ts'), 'utf-8');
    expect(runtimeSupport).toContain("packageName: '@pie-element/test-element'");
    expect(runtimeSupport).toContain('delivery: true');
    expect(runtimeSupport).toContain('author: true');
    expect(runtimeSupport).toContain('print: true');

    const pkgJson = JSON.parse(await readFile(join(elementDir, 'package.json'), 'utf-8'));
    expect(pkgJson.exports['./runtime-support']).toEqual({
      types: './dist/runtime-support.d.ts',
      default: './dist/runtime-support.js',
    });
  });

  it('emits legacy configure metadata and shim from the modern author entry', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await createElementBase(elementDir);
    await mkdir(join(elementDir, 'src', 'author'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'author', 'index.ts'),
      'export default class AuthorElement {}\n',
      'utf-8'
    );
    await mkdir(join(elementDir, 'src', 'controller'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'controller', 'index.ts'),
      'export default class Controller {}\n',
      'utf-8'
    );

    const changed = await ensureElementPackageJson(
      'test-element',
      elementDir,
      createConfig(rootDir)
    );
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(elementDir, 'package.json'), 'utf-8'));
    expect(pkgJson.pie.controller).toBe('@pie-element/test-element/controller');
    expect(pkgJson.pie.configure).toBe('@pie-element/test-element/configure');
    expect(pkgJson.exports['./author']).toEqual({
      types: './dist/author/index.d.ts',
      default: './dist/author/index.js',
    });
    expect(pkgJson.exports['./configure']).toEqual({
      types: './dist/author/index.d.ts',
      default: './dist/author/index.js',
    });
    expect(pkgJson.files).toContain('configure.js');
    await expect(readFile(join(elementDir, 'configure.js'), 'utf-8')).resolves.toBe(
      "export { default } from './dist/author/index.js';\nexport * from './dist/author/index.js';\n"
    );
  });

  it('emits legacy configure metadata and shim for author-only packages', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await createElementBase(elementDir);
    await mkdir(join(elementDir, 'src', 'author'), { recursive: true });
    await writeFile(
      join(elementDir, 'src', 'author', 'index.ts'),
      'export default class AuthorElement {}\n',
      'utf-8'
    );

    const changed = await ensureElementPackageJson(
      'test-element',
      elementDir,
      createConfig(rootDir)
    );
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(elementDir, 'package.json'), 'utf-8'));
    expect(pkgJson.pie.controller).toBeUndefined();
    expect(pkgJson.pie.configure).toBe('@pie-element/test-element/configure');
    expect(pkgJson.exports['./controller']).toBeUndefined();
    expect(pkgJson.exports['./configure']).toEqual({
      types: './dist/author/index.d.ts',
      default: './dist/author/index.js',
    });
    expect(pkgJson.files).toContain('configure.js');
    expect(pkgJson.files).not.toContain('controller.js');
    expect(existsSync(join(elementDir, 'controller.js'))).toBe(false);
    await expect(readFile(join(elementDir, 'configure.js'), 'utf-8')).resolves.toBe(
      "export { default } from './dist/author/index.js';\nexport * from './dist/author/index.js';\n"
    );
  });

  it('removes stale root compatibility shims when source entries disappear', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');

    await createElementBase(elementDir);
    await writeFile(
      join(elementDir, 'controller.js'),
      "export * from './dist/controller/index.js';\n",
      'utf-8'
    );
    await writeFile(
      join(elementDir, 'configure.js'),
      "export { default } from './dist/author/index.js';\nexport * from './dist/author/index.js';\n",
      'utf-8'
    );
    await writeFile(
      join(elementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/test-element',
          files: ['configure.js', 'controller.js', 'dist'],
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
    expect(pkgJson.files).toEqual(['dist']);
    expect(pkgJson.pie).toBeUndefined();
    expect(existsSync(join(elementDir, 'controller.js'))).toBe(false);
    expect(existsSync(join(elementDir, 'configure.js'))).toBe(false);
  });
});

describe('ensurePieLibPackageJson', () => {
  it('preserves local pie-lib package versions during sync', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'render-ui');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'render-ui');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(join(libDir, 'src', 'index.ts'), 'export {};\n', 'utf-8');
    await writeFile(
      join(libDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/render-ui',
          version: '4.2.0-next.3',
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/render-ui',
          version: '1.0.0',
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('render-ui', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.version).toBe('4.2.0-next.3');
  });

  it('moves pie-lib React runtime metadata to React 18 peer dependencies', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'test-utils');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'test-utils');
    const testingLibraryDir = join(rootDir, 'node_modules', '@testing-library', 'react');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await mkdir(testingLibraryDir, { recursive: true });
    await writeFile(
      join(libDir, 'src', 'index.tsx'),
      "import React from 'react';\nimport { render } from '@testing-library/react';\nexport { React, render };\n",
      'utf-8'
    );
    await writeFile(
      join(testingLibraryDir, 'package.json'),
      JSON.stringify(
        {
          name: '@testing-library/react',
          version: '16.3.2',
          peerDependencies: {
            react: '^18.0.0 || ^19.0.0',
            'react-dom': '^18.0.0 || ^19.0.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/test-utils',
          dependencies: {
            '@testing-library/react': '^16.3.2',
            react: '^16.8.0',
            'react-dom': '^16.8.0',
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
      '@testing-library/react': '^16.3.2',
    });
    expect(pkgJson.dependencies).not.toHaveProperty('react');
    expect(pkgJson.dependencies).not.toHaveProperty('react-dom');
    expect(pkgJson.peerDependencies).toEqual({
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    });
  });

  it('applies the browser ESM dependency policy to pie-lib package dependencies', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'graphing');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'graphing');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(
      join(libDir, 'src', 'index.ts'),
      "import cx from 'clsx';\nexport { cx };\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/graphing',
          version: '1.0.0',
          dependencies: {
            classnames: '^2.2.6',
            lodash: '^4.17.21',
            mathjs: '^7.5.1',
            'react-draggable': '^3.3.0',
            'react-input-autosize': '^2.2.1',
            'react-redux': '^6.0.0',
            redux: '^4.0.1',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('graphing', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).toMatchObject({
      '@pie-element/shared-lodash': 'workspace:*',
      clsx: '^2.1.1',
      mathjs: '^15.2.0',
      'react-draggable': '^4.6.0',
      'react-redux': '^9.3.0',
      redux: '^5.0.1',
    });
    expect(pkgJson.dependencies).not.toHaveProperty('classnames');
    expect(pkgJson.dependencies).not.toHaveProperty('lodash');
    expect(pkgJson.dependencies).not.toHaveProperty('lodash-es');
    expect(pkgJson.dependencies).not.toHaveProperty('react-input-autosize');
  });

  it('removes mathjs from config-ui when the local fraction helper is generated', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'config-ui');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'config-ui');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(
      join(libDir, 'src', 'number-text-field-custom.tsx'),
      "import { fractionToNumber } from './fraction-to-number.js';\nexport { fractionToNumber };\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/config-ui',
          version: '1.0.0',
          dependencies: {
            mathjs: '^7.5.1',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('config-ui', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).not.toHaveProperty('mathjs');
  });

  it('keeps mathjs in config-ui if synced source still imports it', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'config-ui');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'config-ui');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(
      join(libDir, 'src', 'unmatched-math.ts'),
      "import * as math from 'mathjs';\nexport const value = math.evaluate('1/2');\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/config-ui',
          version: '1.0.0',
          dependencies: {
            mathjs: '^7.5.1',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('config-ui', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies.mathjs).toBe('^15.2.0');
  });

  it('keeps mathjs pinned for pie-lib packages without a generated math helper', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'plot');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'plot');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(join(libDir, 'src', 'index.ts'), 'export const value = 1;\n', 'utf-8');
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/plot',
          version: '1.0.0',
          dependencies: {
            mathjs: '^7.5.1',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('plot', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies.mathjs).toBe('^15.2.0');
  });

  it('does not remove react-input-autosize from pie-lib packages without the generated local component', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const libDir = join(rootDir, 'packages', 'lib-react', 'plot');
    const upstreamLibDir = join(rootDir, 'upstream', 'pie-lib', 'packages', 'plot');

    await mkdir(join(libDir, 'src'), { recursive: true });
    await mkdir(upstreamLibDir, { recursive: true });
    await writeFile(join(libDir, 'src', 'index.ts'), 'export {};\n', 'utf-8');
    await writeFile(
      join(upstreamLibDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/plot',
          version: '1.0.0',
          dependencies: {
            'react-input-autosize': '^2.2.1',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const changed = await ensurePieLibPackageJson('plot', libDir, createConfig(rootDir));
    expect(changed).toBe(true);

    const pkgJson = JSON.parse(await readFile(join(libDir, 'package.json'), 'utf-8'));
    expect(pkgJson.dependencies).toHaveProperty('react-input-autosize', '^2.2.1');
  });

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
    expect(pkgJson.files).toEqual(['dist']);
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

  it('preserves upstream mathquill deps without remapping', async () => {
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
      '@pie-framework/mathquill': '^1.0.0',
    });
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
