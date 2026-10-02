import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateEntries } from '../src/entry-generator.js';

function makeWorkspace(
  packages: Record<string, { manifest: Record<string, unknown>; files?: string[] }>
): string {
  const root = mkdtempSync(join(tmpdir(), 'pie-entry-gen-'));
  for (const [name, { manifest, files = [] }] of Object.entries(packages)) {
    const packageRoot = join(root, 'node_modules', name);
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify(manifest), 'utf8');
    for (const relative of files) {
      const full = join(packageRoot, relative);
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, '', 'utf8');
    }
  }
  return root;
}

/** What a published ng element ships: root shims plus the dist they re-export. */
const PUBLISHED_FILES = [
  'controller.js',
  'configure.js',
  'print.js',
  'dist/index.js',
  'dist/controller/index.js',
  'dist/author/index.js',
  'dist/print/index.js',
];

const NG_ELEMENT = {
  name: '@pie-element/mc-populated-blank',
  version: '1.0.0',
  pie: {
    controller: '@pie-element/mc-populated-blank/controller',
    configure: '@pie-element/mc-populated-blank/configure',
  },
  exports: {
    '.': { types: './dist/index.d.ts', default: './dist/index.js' },
    './controller': { default: './dist/controller/index.js' },
    './configure': { default: './dist/author/index.js' },
    './print': { default: './dist/print/index.js' },
  },
};

const DEP = { name: '@pie-element/mc-populated-blank', version: '1.0.0' };

describe('generateEntries', () => {
  it('emits the bare subpath specifiers a published element declares', () => {
    const workspace = makeWorkspace({
      '@pie-element/mc-populated-blank': { manifest: NG_ELEMENT, files: PUBLISHED_FILES },
    });

    const entries = generateEntries([DEP], workspace, ['player', 'client-player', 'editor']);

    expect(entries.player).toContain(
      "import McPopulatedBlankPrint from '@pie-element/mc-populated-blank/print';"
    );
    expect(entries.player).toContain('Print: McPopulatedBlankPrint');
    expect(entries['client-player']).toContain(
      "import * as McPopulatedBlankController from '@pie-element/mc-populated-blank/controller';"
    );
    expect(entries.editor).toContain(
      "import McPopulatedBlankConfigure from '@pie-element/mc-populated-blank/configure';"
    );
    expect(entries.editor).toContain('Configure: McPopulatedBlankConfigure');
  });

  it('never rewrites a specifier to a dist path', () => {
    const workspace = makeWorkspace({
      '@pie-element/mc-populated-blank': { manifest: NG_ELEMENT, files: PUBLISHED_FILES },
    });

    const entries = generateEntries([DEP], workspace, ['player', 'client-player', 'editor']);

    for (const entry of Object.values(entries)) {
      expect(entry).not.toContain('/dist/');
      expect(entry).not.toContain('/module/');
      expect(entry).not.toContain('/lib/');
    }
  });

  it('accepts the workspace-fast layout, where subpaths exist only as TypeScript sources', () => {
    const workspace = makeWorkspace({
      '@pie-element/mc-populated-blank': {
        manifest: NG_ELEMENT,
        files: ['src/index.ts', 'src/controller/index.ts', 'src/print/index.ts', 'configure.js'],
      },
    });

    const entries = generateEntries([DEP], workspace, ['player', 'client-player', 'editor']);

    expect(entries['client-player']).toContain("'@pie-element/mc-populated-blank/controller'");
    expect(entries.player).toContain("'@pie-element/mc-populated-blank/print'");
    expect(entries.editor).toContain("'@pie-element/mc-populated-blank/configure'");
  });

  it('resolves configure through configure.js, since the source lives at src/author', () => {
    const workspace = makeWorkspace({
      '@pie-element/mc-populated-blank': {
        manifest: NG_ELEMENT,
        files: ['configure.js', 'dist/author/index.js'],
      },
    });

    const entries = generateEntries([DEP], workspace, ['editor']);

    expect(entries.editor).toContain(
      "import McPopulatedBlankConfigure from '@pie-element/mc-populated-blank/configure';"
    );
  });

  it('omits a declared print that ships no target, instead of failing the bundle', () => {
    // @pie-element/multiple-choice@11.x declares "./print": "./src/print.js" and publishes no src/.
    const workspace = makeWorkspace({
      '@pie-element/multiple-choice': {
        manifest: {
          name: '@pie-element/multiple-choice',
          version: '11.4.3',
          exports: { '.': './lib/index.js', './print': './src/print.js' },
        },
        files: ['lib/index.js'],
      },
    });

    const entries = generateEntries(
      [{ name: '@pie-element/multiple-choice', version: '11.4.3' }],
      workspace,
      ['player']
    );

    expect(entries.player).toContain("import MultipleChoice from '@pie-element/multiple-choice';");
    expect(entries.player).not.toContain('Print:');
    expect(entries.player).not.toContain('/print');
  });

  it('omits controller and configure when they name separate packages', () => {
    // The legacy convention: nested packages with their own names, which this bundler
    // does not install. Emitting them would fail the compilation.
    const workspace = makeWorkspace({
      '@pie-element/multiple-choice': {
        manifest: {
          name: '@pie-element/multiple-choice',
          version: '11.4.3',
          pie: {
            controller: '@pie-element/multiple-choice-controller',
            configure: '@pie-element/multiple-choice-configure',
          },
        },
        files: ['lib/index.js'],
      },
    });

    const entries = generateEntries(
      [{ name: '@pie-element/multiple-choice', version: '11.4.3' }],
      workspace,
      ['client-player', 'editor']
    );

    expect(entries['client-player']).not.toContain('controller');
    expect(entries.editor).not.toContain('Configure');
    expect(entries.editor).toContain("'@pie-element/multiple-choice': { Element: MultipleChoice }");
  });

  it('omits a pie subpath whose target is absent on disk', () => {
    const workspace = makeWorkspace({
      '@pie-element/mc-populated-blank': {
        manifest: NG_ELEMENT,
        files: ['dist/index.js'],
      },
    });

    const entries = generateEntries([DEP], workspace, ['player', 'client-player', 'editor']);

    expect(entries['client-player']).not.toContain('Controller');
    expect(entries.editor).not.toContain('Configure');
    expect(entries.player).not.toContain('Print');
  });

  it('keys every bundle by both bare and versioned package name', () => {
    const workspace = makeWorkspace({
      '@pie-element/mc-populated-blank': { manifest: NG_ELEMENT, files: PUBLISHED_FILES },
    });

    const entries = generateEntries([DEP], workspace, ['player', 'client-player', 'editor']);

    for (const entry of Object.values(entries)) {
      expect(entry).toContain("'@pie-element/mc-populated-blank':");
      expect(entry).toContain("'@pie-element/mc-populated-blank@1.0.0':");
    }
  });
});
