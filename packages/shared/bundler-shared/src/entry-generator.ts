/**
 * Generate entry files (player.js, client-player.js, editor.js)
 * Simplified from pie-api-aws/packages/bundler/src/code-generator.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildBundleName, BuildDependency } from './types.js';

type EntryFiles = Partial<Record<BuildBundleName, string>>;

const SOURCE_INDEX_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Whether `<pkg>/<subpath>` resolves to something on disk.
 *
 * Both bundler modes alias `@pie-element` to a directory, so a subpath request resolves as a
 * literal filesystem path and never consults the package's `exports` map. What it lands on is
 * the published root `<subpath>.js` shim — the same mechanism the pie-api-aws bundler relies on
 * for `controller` and `configure`. `workspace-fast` additionally installs exact aliases onto
 * `src/<subpath>/index.ts`, so accept that shape too.
 *
 * A declared subpath with neither is omitted from the bundle. The legacy React packages need
 * this: `@pie-element/multiple-choice@11.x` declares `"./print": "./src/print.js"` and publishes
 * no `src/` at all, and an unresolvable import fails the whole compilation rather than one view.
 */
function subpathResolves(packageRoot: string, subpath: string): boolean {
  if (existsSync(join(packageRoot, `${subpath}.js`))) {
    return true;
  }
  return SOURCE_INDEX_EXTENSIONS.some((extension) =>
    existsSync(join(packageRoot, 'src', subpath, `index${extension}`))
  );
}

/**
 * The subpath a `pie.controller` / `pie.configure` specifier points at within its own package.
 *
 * Returns null for the legacy convention, where those fields name separate packages
 * (`@pie-element/multiple-choice-controller`) that this bundler does not install.
 */
function ownSubpath(pkgName: string, specifier: unknown): string | null {
  if (typeof specifier !== 'string') {
    return null;
  }
  const prefix = `${pkgName}/`;
  if (!specifier.startsWith(prefix)) {
    return null;
  }
  const subpath = specifier.slice(prefix.length);
  return subpath.length > 0 ? subpath : null;
}

/** Resolve a declared subpath to an import specifier, or null when it does not resolve. */
function verifiedSpecifier(
  pkgName: string,
  packageRoot: string,
  subpath: string | null,
  label: string
): string | null {
  if (!subpath) {
    return null;
  }
  if (!subpathResolves(packageRoot, subpath)) {
    console.warn(
      `[entry-generator] ${pkgName} declares ${label} but neither ${subpath}.js nor src/${subpath}/index.* resolves on disk; omitting it from the bundle.`
    );
    return null;
  }
  return `${pkgName}/${subpath}`;
}

export function generateEntries(
  deps: BuildDependency[],
  workspaceDir: string,
  requestedBundles: BuildBundleName[]
): EntryFiles {
  const imports: Record<BuildBundleName, string[]> = {
    player: [],
    'client-player': [],
    editor: [],
  };
  const registrations: Record<BuildBundleName, string[]> = {
    player: [],
    'client-player': [],
    editor: [],
  };

  const register = (
    bundle: BuildBundleName,
    dep: BuildDependency,
    members: Array<[string, string]>
  ) => {
    const body = members.map(([key, value]) => `${key}: ${value}`).join(', ');
    registrations[bundle].push(`  '${dep.name}': { ${body} },`);
    registrations[bundle].push(`  '${dep.name}@${dep.version}': { ${body} },`);
  };

  for (const dep of deps) {
    const packageRoot = join(workspaceDir, 'node_modules', dep.name);
    const pkgJsonPath = join(packageRoot, 'package.json');

    let pkgJson: any;
    try {
      pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    } catch (error: any) {
      console.error(
        `[entry-generator] Failed to read package.json for ${dep.name}:`,
        error.message
      );
      throw error;
    }

    const elementName = toElementName(dep.name);

    // The authoring and scoring surfaces come from `pie.configure` / `pie.controller`, which is
    // the contract the pie-api-aws bundler reads. Print has no `pie` field, so it is taken from
    // the `exports` map. Either way the declaration decides, and disk resolution confirms.
    const pie = pkgJson.pie ?? {};
    const controllerSpecifier = verifiedSpecifier(
      dep.name,
      packageRoot,
      ownSubpath(dep.name, pie.controller),
      'pie.controller'
    );
    const configureSpecifier = verifiedSpecifier(
      dep.name,
      packageRoot,
      ownSubpath(dep.name, pie.configure),
      'pie.configure'
    );
    const printSpecifier = pkgJson.exports?.['./print']
      ? verifiedSpecifier(dep.name, packageRoot, 'print', 'exports["./print"]')
      : null;

    // Every bundle registers the element itself, whatever else resolves. An element with no
    // controller and no Configure still has to be renderable in the editor.
    for (const bundle of ['player', 'client-player', 'editor'] as BuildBundleName[]) {
      imports[bundle].push(`import ${elementName} from '${dep.name}';`);
    }

    const playerMembers: Array<[string, string]> = [['Element', elementName]];
    if (printSpecifier) {
      const printName = `${elementName}Print`;
      imports.player.push(`import ${printName} from '${printSpecifier}';`);
      playerMembers.push(['Print', printName]);
    }
    register('player', dep, playerMembers);

    const controllerName = `${elementName}Controller`;
    if (controllerSpecifier) {
      imports['client-player'].push(`import * as ${controllerName} from '${controllerSpecifier}';`);
      imports.editor.push(`import * as ${controllerName} from '${controllerSpecifier}';`);
    }

    const clientMembers: Array<[string, string]> = [['Element', elementName]];
    if (controllerSpecifier) {
      clientMembers.push(['controller', controllerName]);
    }
    register('client-player', dep, clientMembers);

    const editorMembers: Array<[string, string]> = [['Element', elementName]];
    if (configureSpecifier) {
      const configureName = `${elementName}Configure`;
      imports.editor.push(`import ${configureName} from '${configureSpecifier}';`);
      editorMembers.push(['Configure', configureName]);
    }
    if (controllerSpecifier) {
      editorMembers.push(['controller', controllerName]);
    }
    register('editor', dep, editorMembers);
  }

  const output: EntryFiles = {};
  for (const bundle of ['player', 'client-player', 'editor'] as BuildBundleName[]) {
    if (!requestedBundles.includes(bundle)) {
      continue;
    }
    output[bundle] = `
${imports[bundle].join('\n')}

export default {
${registrations[bundle].join('\n')}
};
    `.trim();
  }

  return output;
}

function toElementName(pkgName: string): string {
  // @pie-element/multiple-choice -> MultipleChoice
  return pkgName
    .replace('@pie-element/', '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}
