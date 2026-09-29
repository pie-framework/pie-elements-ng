import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveSourceAliases } from '../src/source-aliases.js';

function makeNodeModules(
  packages: Record<string, { manifest: Record<string, unknown>; files?: string[] }>
): string {
  const nodeModules = mkdtempSync(join(tmpdir(), 'pie-source-aliases-'));
  for (const [name, { manifest, files = [] }] of Object.entries(packages)) {
    const packageRoot = join(nodeModules, name);
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name, ...manifest }), 'utf8');
    for (const relative of files) {
      mkdirSync(join(packageRoot, relative, '..'), { recursive: true });
      writeFileSync(join(packageRoot, relative), '', 'utf8');
    }
  }
  return nodeModules;
}

const elementExports = {
  '.': { types: './dist/index.d.ts', default: './dist/index.js' },
  './controller': { types: './dist/controller/index.d.ts', default: './dist/controller/index.js' },
  './configure': { types: './dist/author/index.d.ts', default: './dist/author/index.js' },
  './browser/delivery': { default: './dist/browser/delivery/index.js' },
  './print': './src/print.js',
  './*': './dist/*.js',
};

describe('resolveSourceAliases', () => {
  it('maps each declared entry point onto its source, following the exports map', () => {
    const nodeModules = makeNodeModules({
      '@pie-element/multiple-choice': {
        manifest: { exports: elementExports },
        files: ['src/index.ts', 'src/controller/index.ts', 'src/author/index.tsx', 'src/print.js'],
      },
    });
    const root = join(nodeModules, '@pie-element/multiple-choice');

    expect(resolveSourceAliases(nodeModules)).toEqual({
      '@pie-element/multiple-choice$': join(root, 'src/index.ts'),
      '@pie-element/multiple-choice/controller$': join(root, 'src/controller/index.ts'),
      '@pie-element/multiple-choice/configure$': join(root, 'src/author/index.tsx'),
    });
  });

  it('falls back to module or main when a package declares no exports', () => {
    const nodeModules = makeNodeModules({
      '@pie-lib/tools': { manifest: { main: './dist/index.js' }, files: ['src/index.ts'] },
    });

    expect(resolveSourceAliases(nodeModules)).toEqual({
      '@pie-lib/tools$': join(nodeModules, '@pie-lib/tools', 'src/index.ts'),
    });
  });

  it('leaves published packages, which ship no src, to normal resolution', () => {
    const nodeModules = makeNodeModules({
      '@pie-lib/render-ui': {
        manifest: { exports: { '.': { default: './dist/index.js' } } },
        files: ['dist/index.js'],
      },
      'not-a-pie-package': { manifest: { main: './dist/index.js' }, files: ['src/index.ts'] },
    });

    expect(resolveSourceAliases(nodeModules)).toEqual({});
  });
});
