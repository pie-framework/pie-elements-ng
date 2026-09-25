/**
 * Webpack aliases that bundle linked workspace packages from their sources.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WORKSPACE_SCOPES, isRecord, readManifest } from './workspace-packages.js';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.svelte'];
const TARGET_CONDITIONS = ['development', 'svelte', 'browser', 'import', 'default'];

/**
 * An exact alias for every entry point a package in `nodeModulesDir` declares whose build output
 * has a source counterpart: `exports` (or `module` / `main` when there is no `exports`) targets
 * under `dist/` map to the same path under `src/`, with the extension a source file carries.
 * The package's own `exports` map therefore decides what each specifier bundles, including
 * remaps such as `./configure` onto the author build.
 *
 * Published packages ship no `src/`, so a registry install yields no aliases and bundles as
 * published. Entry points without a source counterpart are left to normal resolution.
 */
export function resolveSourceAliases(nodeModulesDir: string): Record<string, string> {
  const aliases: Record<string, string> = {};
  for (const scope of WORKSPACE_SCOPES) {
    const scopeDir = join(nodeModulesDir, scope);
    if (!existsSync(scopeDir)) {
      continue;
    }
    for (const entry of readdirSync(scopeDir)) {
      const packageDir = join(scopeDir, entry);
      const manifest = readManifest(join(packageDir, 'package.json'));
      const name = manifest?.name;
      if (!manifest || typeof name !== 'string' || !existsSync(join(packageDir, 'src'))) {
        continue;
      }
      for (const [subpath, target] of Object.entries(entryTargets(manifest))) {
        const source = sourceFor(packageDir, target);
        if (source) {
          aliases[subpath === '.' ? `${name}$` : `${name}/${subpath.slice(2)}$`] = source;
        }
      }
    }
  }
  return aliases;
}

/** Subpath (`.` or `./x`) to the runtime file it resolves to. Pattern subpaths are skipped. */
function entryTargets(manifest: Record<string, unknown>): Record<string, string> {
  const { exports } = manifest;
  const entries: Record<string, unknown> =
    typeof exports === 'string'
      ? { '.': exports }
      : isRecord(exports) && Object.keys(exports).some((key) => key.startsWith('.'))
        ? exports
        : isRecord(exports)
          ? { '.': exports }
          : { '.': manifest.module ?? manifest.main };

  const targets: Record<string, string> = {};
  for (const [subpath, value] of Object.entries(entries)) {
    const target = pickTarget(value);
    if (target && !subpath.includes('*')) {
      targets[subpath] = target;
    }
  }
  return targets;
}

function pickTarget(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  for (const condition of TARGET_CONDITIONS) {
    const target = pickTarget(value[condition]);
    if (target) {
      return target;
    }
  }
  return undefined;
}

function sourceFor(packageDir: string, target: string): string | undefined {
  const relative = target.replace(/^\.\//, '');
  if (!relative.startsWith('dist/')) {
    return undefined;
  }
  // `dist/a/index.js` -> `src/a/index`, `dist/b.svelte.js` -> `src/b.svelte`.
  const base = join(packageDir, 'src', relative.slice('dist/'.length).replace(/\.[cm]?jsx?$/, ''));
  return [...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`), base].find(isFile);
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
