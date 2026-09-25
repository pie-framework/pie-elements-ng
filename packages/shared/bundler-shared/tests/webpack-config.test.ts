// @vitest-environment node
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import { afterEach, describe, expect, it } from 'vitest';
import { createControllerWebpackConfig, createWebpackConfig } from '../src/webpack-config.js';

const bundlerNodeModules = fileURLToPath(new URL('../node_modules', import.meta.url));
const workspaces: string[] = [];

function write(root: string, relative: string, content: string): void {
  mkdirSync(dirname(join(root, relative)), { recursive: true });
  writeFileSync(join(root, relative), content, 'utf8');
}

function makeWorkspace(): string {
  const workspaceDir = mkdtempSync(join(tmpdir(), 'pie-webpack-config-'));
  workspaces.push(workspaceDir);
  mkdirSync(join(workspaceDir, 'node_modules'));
  return workspaceDir;
}

afterEach(() => {
  for (const workspaceDir of workspaces.splice(0)) {
    rmSync(workspaceDir, { recursive: true, force: true });
  }
});

function resolveRequest(config: webpack.Configuration, request: string): Promise<string> {
  const compiler = webpack(config);
  const resolver = compiler.resolverFactory.get('normal', { dependencyType: 'esm' });
  return new Promise((resolve, reject) => {
    resolver.resolve({}, config.context as string, request, {}, (error, result) => {
      compiler.close(() => undefined);
      if (error || typeof result !== 'string') {
        reject(error ?? new Error(`${request} did not resolve`));
        return;
      }
      resolve(result);
    });
  });
}

function runWebpack(config: webpack.Configuration): Promise<webpack.Stats> {
  return new Promise((resolve, reject) => {
    webpack(config).run((error, stats) => {
      if (error || !stats) {
        reject(error ?? new Error('webpack returned no stats'));
        return;
      }
      resolve(stats);
    });
  });
}

describe('webpack resolve aliases', () => {
  // A linked workspace element with both a build and its sources, as `workspace-fast` links one.
  function makeLinkedElement(): string {
    const workspaceDir = makeWorkspace();
    const packageDir = join(workspaceDir, 'node_modules', '@pie-element', 'sample');
    write(
      packageDir,
      'package.json',
      JSON.stringify({
        name: '@pie-element/sample',
        main: './dist/index.js',
        exports: {
          '.': { types: './dist/index.d.ts', default: './dist/index.js' },
          './controller': { default: './dist/controller/index.js' },
        },
      })
    );
    for (const file of [
      'dist/index.js',
      'dist/controller/index.js',
      'src/index.ts',
      'src/controller/index.ts',
    ]) {
      write(packageDir, file, 'export {};\n');
    }
    return workspaceDir;
  }

  const configs = {
    element: (workspaceDir: string) =>
      createWebpackConfig({
        context: workspaceDir,
        entry: { player: './player.js' },
        outputPath: join(workspaceDir, 'out'),
        workspaceDir,
        elements: ['sample'],
      }),
    controller: (workspaceDir: string) =>
      createControllerWebpackConfig({
        context: workspaceDir,
        entry: { controller: './controller.js' },
        outputPath: join(workspaceDir, 'out'),
        workspaceDir,
      }),
  };

  it.each(Object.entries(configs))(
    'bundles a linked workspace package from its sources in the %s config',
    async (_name, createConfig) => {
      const workspaceDir = makeLinkedElement();
      const packageDir = realpathSync(join(workspaceDir, 'node_modules', '@pie-element', 'sample'));

      const config = createConfig(workspaceDir);

      expect(realpathSync(await resolveRequest(config, '@pie-element/sample'))).toBe(
        join(packageDir, 'src', 'index.ts')
      );
      expect(realpathSync(await resolveRequest(config, '@pie-element/sample/controller'))).toBe(
        join(packageDir, 'src', 'controller', 'index.ts')
      );
    }
  );
});

describe('Svelte rune modules', () => {
  it('compiles the runes in a .svelte.ts module', async () => {
    const workspaceDir = makeWorkspace();
    for (const tool of ['esbuild-loader', 'svelte', 'svelte-loader']) {
      symlinkSync(
        realpathSync(join(bundlerNodeModules, tool)),
        join(workspaceDir, 'node_modules', tool),
        'dir'
      );
    }
    write(
      workspaceDir,
      'src/counter.svelte.ts',
      [
        'export class Counter {',
        '  count: number = $state(0);',
        '  increment(): void {',
        '    this.count += 1;',
        '  }',
        '}',
        '',
      ].join('\n')
    );
    const outputPath = join(workspaceDir, 'out');

    const stats = await runWebpack(
      createControllerWebpackConfig({
        context: workspaceDir,
        entry: { counter: './src/counter.svelte.ts' },
        outputPath,
        workspaceDir,
      })
    );

    expect(stats.toJson({ errors: true }).errors ?? []).toEqual([]);
    const { Counter } = createRequire(import.meta.url)(join(outputPath, 'counter.js'));
    const counter = new Counter();
    counter.increment();
    expect(counter.count).toBe(1);
  }, 60_000);
});
