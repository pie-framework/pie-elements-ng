import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin, UserConfig } from 'vite';

const configDir = dirname(fileURLToPath(import.meta.url));

/** Where the variant lives, under dist/browser: `<directory>/<view>/index.js`. */
export const EDITOR_RUNTIME_VARIANT_DIRECTORY = 'editor-runtime';

const runtimeManifestPath = resolve(configDir, '../../packages/shared/editor-runtime/package.json');

type RuntimeManifest = {
  name: string;
  version: string;
  pie: { browserModules: Record<string, string> };
};

type ElementManifest = {
  name?: string;
  pie?: {
    browserEditorRuntime?: { name?: string; version?: string; views?: Record<string, string> };
  };
};

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf-8')) as T;

// tiptap and ProseMirror modules, which the runtime provides. @tiptap/react stays inside the
// element with the rest of its React code.
const EDITOR_ENGINE_MODULE =
  /[\\/]node_modules[\\/](?:@tiptap[\\/](?!react[\\/])[^\\/]+|prosemirror-[^\\/]+)[\\/]/;

/**
 * Fails the build when an editor engine module is bundled instead of imported from the runtime:
 * the element would then carry its own copy, which is what the variant exists to remove. The
 * fix is to add the specifier that reaches it to the runtime's pie.browserModules.
 */
const editorEngineStaysExternal = (): Plugin => ({
  name: 'pie-editor-runtime-variant-engine-external',
  buildEnd(error) {
    if (error) return;
    // External modules keep their bare specifier as id, so only bundled ones name a path.
    const bundled = [...this.getModuleIds()].filter((id) => EDITOR_ENGINE_MODULE.test(id));
    if (bundled.length > 0) {
      this.error(
        `the editor-runtime variant bundles editor engine modules that @pie-element/shared-editor-runtime does not provide:\n${bundled.join('\n')}`
      );
    }
  },
});

/**
 * The editor-runtime variant of a browser ESM element build: the same entries with the runtime's
 * specifiers external, written to dist/browser/editor-runtime.
 */
export function editorRuntimeVariant(base: UserConfig): UserConfig {
  const packageDir = base.root;
  const baseExternal = base.build?.rollupOptions?.external;
  if (typeof packageDir !== 'string' || typeof baseExternal !== 'function') {
    throw new Error('editorRuntimeVariant needs a browser ESM element config');
  }

  const runtime = readJson<RuntimeManifest>(runtimeManifestPath);
  const element = readJson<ElementManifest>(resolve(packageDir, 'package.json'));
  const declared = element.pie?.browserEditorRuntime;
  if (declared?.name !== runtime.name || declared.version !== runtime.version) {
    throw new Error(
      `${element.name}: pie.browserEditorRuntime must name ${runtime.name} at ${runtime.version}, the version this build uses; run node scripts/sync-editor-runtime-version.mjs`
    );
  }

  const runtimeSpecifiers = new Set(Object.keys(runtime.pie.browserModules));

  return {
    ...base,
    plugins: [...(base.plugins ?? []), editorEngineStaysExternal()],
    build: {
      ...base.build,
      emptyOutDir: true,
      outDir: resolve(packageDir, 'dist/browser', EDITOR_RUNTIME_VARIANT_DIRECTORY),
      rollupOptions: {
        ...base.build?.rollupOptions,
        external: (id, importer, isResolved) =>
          runtimeSpecifiers.has(id) || baseExternal(id, importer, isResolved),
      },
    },
  };
}
