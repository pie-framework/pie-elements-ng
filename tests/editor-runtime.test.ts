import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectPublishSurfaceViolations } from '../scripts/check-publish-surface.mjs';
import { runtimeWorkspaceDependencies } from '../scripts/lib/runtime-workspace-dependencies.mjs';
import { syncEditorRuntimeVersion } from '../scripts/sync-editor-runtime-version.mjs';

const RUNTIME = '@pie-element/shared-editor-runtime';
const SHARED_REACT = { react: '18.2.0', 'react-dom': '18.2.0' };

type Files = Record<string, string | object>;

async function writeFiles(dir: string, files: Files): Promise<string[]> {
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(dir, relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(
      fullPath,
      typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`,
      'utf8'
    );
  }
  return Object.keys(files);
}

const sourceMap = (...sources: string[]) => ({ version: 3, sources, names: [], mappings: '' });
const ENGINE_SOURCE = '../../../../node_modules/@tiptap/core/dist/index.js';
const REACT_EDITOR_SOURCE = '../../../../node_modules/@tiptap/react/dist/index.js';

async function makeRuntime(root: string, { version = '0.1.0', files = {} as Files } = {}) {
  const dir = join(root, 'packages', 'shared', 'editor-runtime');
  const pkg = {
    name: RUNTIME,
    version,
    files: ['dist'],
    exports: { './package.json': './package.json' },
    pie: {
      browserModules: { '@tiptap/core': 'tiptap-core', '@tiptap/pm/state': 'tiptap-pm-state' },
    },
  };
  const written = await writeFiles(dir, {
    'package.json': pkg,
    'dist/browser/tiptap-core/index.js':
      'import { a as e } from "../chunk-A.js";\nexport { e as Editor };\n',
    'dist/browser/tiptap-pm-state/index.js': 'export * from "../chunk-B.js";\n',
    'dist/browser/chunk-A.js': 'const a = class {};\nexport { a };\n',
    'dist/browser/chunk-B.js': 'export class EditorState {}\nexport const Plugin = 1;\n',
    ...files,
  });
  return { dir, pkg, snapshot: { dir, pkg, packedFiles: new Set(written) } };
}

async function makeElement(
  root: string,
  { declared, views = ['delivery'], files }: { declared?: unknown; views?: string[]; files: Files }
) {
  const dir = join(root, 'packages', 'elements-react', 'editor-element');
  const pkg = {
    name: '@pie-element/editor-element',
    version: '1.0.0',
    files: ['dist'],
    exports: {
      './package.json': './package.json',
      ...Object.fromEntries(
        views.map((view) => [`./browser/${view}`, { default: `./dist/browser/${view}/index.js` }])
      ),
    },
    pie: {
      browserSharedDependencies: SHARED_REACT,
      ...(declared === undefined ? {} : { browserEditorRuntime: declared }),
    },
  };
  const written = await writeFiles(dir, { 'package.json': pkg, ...files });
  return { dir, pkg, packedFiles: new Set(written) };
}

const declaration = (version = '0.1.0', views = ['delivery']) => ({
  name: RUNTIME,
  version,
  views: Object.fromEntries(views.map((view) => [view, `editor-runtime/${view}`])),
});

// The standard delivery view bundles the engine; its variant imports it from the runtime.
const elementFiles = (variantSource: string, variantMap = sourceMap(REACT_EDITOR_SOURCE)) => ({
  'dist/browser/delivery/index.js':
    'import React from "react";\nexport default class extends HTMLElement {}\n',
  'dist/browser/delivery/index.js.map': sourceMap(REACT_EDITOR_SOURCE, ENGINE_SOURCE),
  'dist/browser/editor-runtime/delivery/index.js': variantSource,
  'dist/browser/editor-runtime/delivery/index.js.map': variantMap,
});

const VARIANT_SOURCE =
  'import React from "react";\nimport { Editor } from "@tiptap/core";\nimport { EditorState, Plugin } from "@tiptap/pm/state";\nexport default class extends HTMLElement {}\n';

const fixtureRoot = () => mkdtemp(join(tmpdir(), 'pie-editor-runtime-'));

describe('editor-runtime variant publish surface', () => {
  it('lets the variant import the runtime specifiers the ./browser/* build may not', async () => {
    const root = await fixtureRoot();
    const runtime = await makeRuntime(root);
    const element = await makeElement(root, {
      declared: declaration(),
      files: elementFiles(VARIANT_SOURCE),
    });

    expect(collectPublishSurfaceViolations(element, { editorRuntime: runtime })).toEqual([]);

    const standard = await makeElement(await fixtureRoot(), {
      declared: declaration(),
      files: { ...elementFiles(VARIANT_SOURCE), 'dist/browser/delivery/index.js': VARIANT_SOURCE },
    });
    expect(collectPublishSurfaceViolations(standard, { editorRuntime: runtime })).toContain(
      'dist/browser/delivery/index.js contains unsupported bare browser import "@tiptap/core"'
    );
  });

  it('requires the declared runtime version to be the one the workspace builds against', async () => {
    const root = await fixtureRoot();
    const runtime = await makeRuntime(root, { version: '0.1.1-next.0' });
    const element = await makeElement(root, {
      declared: declaration('0.1.0'),
      files: elementFiles(VARIANT_SOURCE),
    });
    const ranged = await makeElement(await fixtureRoot(), {
      declared: declaration('^0.1.0'),
      files: elementFiles(VARIANT_SOURCE),
    });

    expect(collectPublishSurfaceViolations(element, { editorRuntime: runtime })).toContain(
      `pie.browserEditorRuntime.version must be "0.1.1-next.0", the ${RUNTIME} version the variant is built against (run node scripts/sync-editor-runtime-version.mjs)`
    );
    expect(collectPublishSurfaceViolations(ranged, { editorRuntime: runtime })).toContain(
      'pie.browserEditorRuntime.version must be an exact version'
    );
  });

  it('rejects a name the runtime view for its specifier does not export', async () => {
    const root = await fixtureRoot();
    const runtime = await makeRuntime(root);
    const element = await makeElement(root, {
      declared: declaration(),
      files: elementFiles(
        'import { Editor, NodePos } from "@tiptap/core";\nexport default class extends HTMLElement {}\n'
      ),
    });

    expect(collectPublishSurfaceViolations(element, { editorRuntime: runtime })).toEqual([
      `dist/browser/editor-runtime/delivery/index.js imports NodePos from "@tiptap/core", which ${RUNTIME} dist/browser/tiptap-core/index.js does not export`,
    ]);
  });

  it('rejects a variant that bundles the editor engine itself', async () => {
    const root = await fixtureRoot();
    const runtime = await makeRuntime(root);
    const element = await makeElement(root, {
      declared: declaration(),
      files: elementFiles(VARIANT_SOURCE, sourceMap(REACT_EDITOR_SOURCE, ENGINE_SOURCE)),
    });

    expect(collectPublishSurfaceViolations(element, { editorRuntime: runtime })).toEqual([
      `dist/browser/editor-runtime/delivery/index.js bundles the editor engine (@tiptap/core), which the editor-runtime variant imports from ${RUNTIME}`,
    ]);
  });

  it('requires the declaration exactly when ./browser/* bundles the editor engine', async () => {
    const root = await fixtureRoot();
    const runtime = await makeRuntime(root);
    const undeclared = await makeElement(root, {
      files: {
        'dist/browser/delivery/index.js': 'export default class extends HTMLElement {}\n',
        'dist/browser/delivery/index.js.map': sourceMap(
          '../../../../node_modules/.bun/prosemirror-model@1.25.4/node_modules/prosemirror-model/dist/index.js'
        ),
      },
    });
    const needless = await makeElement(await fixtureRoot(), {
      declared: declaration(),
      files: {
        ...elementFiles(VARIANT_SOURCE),
        'dist/browser/delivery/index.js.map': sourceMap(REACT_EDITOR_SOURCE),
      },
    });

    expect(collectPublishSurfaceViolations(undeclared, { editorRuntime: runtime })).toEqual([
      'dist/browser/delivery/index.js bundles the editor engine (prosemirror-model), so the package must build the editor-runtime variant and declare it in pie.browserEditorRuntime',
    ]);
    expect(collectPublishSurfaceViolations(needless, { editorRuntime: runtime })).toEqual([
      'pie.browserEditorRuntime is declared, but no module reachable from the ./browser/* exports bundles the editor engine',
    ]);
  });

  it('requires a variant view for every ./browser/* view', async () => {
    const root = await fixtureRoot();
    const runtime = await makeRuntime(root);
    const element = await makeElement(root, {
      declared: declaration('0.1.0', ['delivery']),
      views: ['delivery', 'controller'],
      files: {
        ...elementFiles(VARIANT_SOURCE),
        'dist/browser/controller/index.js': 'export const model = () => ({});\n',
      },
    });

    expect(collectPublishSurfaceViolations(element, { editorRuntime: runtime })).toEqual([
      'pie.browserEditorRuntime.views must map every ./browser/* view (controller, delivery), found delivery',
    ]);
  });
});

describe('editor runtime package publish surface', () => {
  it('accepts views that import only each other', async () => {
    const runtime = await makeRuntime(await fixtureRoot());

    expect(collectPublishSurfaceViolations(runtime.snapshot, { editorRuntime: runtime })).toEqual(
      []
    );
  });

  it('rejects a bare import, React included, and any installed dependency', async () => {
    const runtime = await makeRuntime(await fixtureRoot(), {
      files: { 'dist/browser/chunk-A.js': 'import "react";\nconst a = class {};\nexport { a };\n' },
    });
    const pkg = { ...runtime.pkg, peerDependencies: { react: '^18.2.0' } };

    expect(
      collectPublishSurfaceViolations({ ...runtime.snapshot, pkg }, { editorRuntime: runtime })
    ).toEqual([
      'peerDependencies must be empty: the editor runtime bundles everything it runs',
      'dist/browser/chunk-A.js imports "react"; the editor runtime imports nothing bare',
    ]);
  });
});

describe('syncEditorRuntimeVersion', () => {
  it('points stale declarations at the runtime version and leaves the rest untouched', async () => {
    const root = await fixtureRoot();
    await writeFiles(root, {
      'package.json': { workspaces: ['packages/shared/*', 'packages/elements-react/*'] },
    });
    await makeRuntime(root, { version: '0.1.1-next.0' });
    const elements = join(root, 'packages', 'elements-react');
    await writeFiles(elements, {
      'stale/package.json': {
        name: '@pie-element/stale',
        pie: { browserEditorRuntime: declaration('0.1.0') },
      },
      'current/package.json': {
        name: '@pie-element/current',
        pie: { browserEditorRuntime: declaration('0.1.1-next.0') },
      },
      'plain/package.json': { name: '@pie-element/plain', pie: { controller: 'x' } },
    });
    const before = await readFile(join(elements, 'current', 'package.json'), 'utf8');

    expect(syncEditorRuntimeVersion({ root })).toEqual({
      runtime: `${RUNTIME}@0.1.1-next.0`,
      updated: ['@pie-element/stale'],
    });
    expect(await readFile(join(elements, 'stale', 'package.json'), 'utf8')).toBe(
      `${JSON.stringify({ name: '@pie-element/stale', pie: { browserEditorRuntime: declaration('0.1.1-next.0') } }, null, 2)}\n`
    );
    expect(await readFile(join(elements, 'current', 'package.json'), 'utf8')).toBe(before);
  });
});

describe('runtimeWorkspaceDependencies', () => {
  it('orders the declared editor runtime ahead of the element, like a dependency', () => {
    const local = new Map([
      [RUNTIME, '0.1.1-next.0'],
      ['@pie-lib/editable-html-tip-tap', '3.0.0-next.40'],
      ['@pie-lib/test-utils', '1.0.0'],
    ]);
    const pkg = {
      name: '@pie-element/editor-element',
      dependencies: { '@pie-lib/editable-html-tip-tap': 'workspace:*', react: '^18.2.0' },
      devDependencies: { '@pie-lib/test-utils': 'workspace:*' },
      pie: { browserEditorRuntime: declaration('0.1.1-next.0') },
    };

    expect(
      runtimeWorkspaceDependencies(pkg, local).map(({ dependencyName, version, section }) => ({
        dependencyName,
        version,
        section,
      }))
    ).toEqual([
      {
        dependencyName: '@pie-lib/editable-html-tip-tap',
        version: '3.0.0-next.40',
        section: 'dependencies',
      },
      { dependencyName: RUNTIME, version: '0.1.1-next.0', section: 'pie.browserEditorRuntime' },
    ]);
  });
});
