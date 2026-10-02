import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORKSPACE } from './sync-constants.js';
import { findWorkspacePieLibPackages } from './workspace-pie-lib.js';

const EDITOR_RUNTIME_MANIFEST = 'packages/shared/editor-runtime/package.json';
// tiptap and ProseMirror, which @pie-element/shared-editor-runtime provides. @tiptap/react stays
// inside the element.
const EDITOR_ENGINE_PACKAGE = /^(?:@tiptap\/(?!react$)|prosemirror-)/;
const VARIANT_VIEWS = ['delivery', 'author', 'print', 'controller'] as const;

export type BrowserEditorRuntime = {
  name: string;
  version: string;
  views: Record<string, string>;
};

const readDependencies = (manifestPath: string): Record<string, string> => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return { ...manifest.dependencies, ...manifest.optionalDependencies };
};

/**
 * True when `dependencies`, directly or through the workspace @pie-lib packages they reach,
 * include the editor engine, so the element's browser build bundles it.
 */
export function reachesEditorEngine(root: string, dependencies: Record<string, string>): boolean {
  const libraries = findWorkspacePieLibPackages(root);
  const visited = new Set<string>();
  const pending = Object.keys(dependencies);
  while (pending.length > 0) {
    const name = pending.pop() as string;
    if (visited.has(name)) continue;
    visited.add(name);
    if (EDITOR_ENGINE_PACKAGE.test(name)) return true;
    const libraryDir = name.startsWith(WORKSPACE.PIE_LIB_PREFIX)
      ? libraries.get(name.slice(WORKSPACE.PIE_LIB_PREFIX.length))
      : undefined;
    if (libraryDir)
      pending.push(...Object.keys(readDependencies(join(libraryDir, 'package.json'))));
  }
  return false;
}

/**
 * pie.browserEditorRuntime for an element with the given ./browser/* views: the runtime's name,
 * its current workspace version, and each view's variant. Null when the workspace has no runtime.
 */
export function browserEditorRuntimeDeclaration(
  root: string,
  views: ReadonlySet<string>
): BrowserEditorRuntime | null {
  const manifestPath = join(root, EDITOR_RUNTIME_MANIFEST);
  if (!existsSync(manifestPath)) return null;
  const runtime = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return {
    name: runtime.name,
    version: runtime.version,
    views: Object.fromEntries(
      VARIANT_VIEWS.filter((view) => views.has(view)).map((view) => [
        view,
        `editor-runtime/${view}`,
      ])
    ),
  };
}
