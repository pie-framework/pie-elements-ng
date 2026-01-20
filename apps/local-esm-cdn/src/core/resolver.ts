import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileExists } from './utils.js';

/**
 * Parsed package request information
 */
export interface PackageRequest {
  pkg: string;
  subpath: string;
}

/**
 * Parse a package request from a URL pathname
 * @param pathname - The URL pathname (e.g., "/@pie-element/hotspot@1.0.0/index.js")
 * @returns The parsed package and subpath, or null if invalid
 */
export function parsePackageRequest(pathname: string): PackageRequest | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const scope = parts[0];
  if (
    scope !== '@pie-element' &&
    scope !== '@pie-lib' &&
    scope !== '@pie-elements-ng' &&
    scope !== '@pie-framework'
  )
    return null;

  const nameWithVersion = parts[1];
  // Accept either "<name>@<version>" or "<name>".
  const at = nameWithVersion.lastIndexOf('@');
  const name = at > 0 ? nameWithVersion.slice(0, at) : nameWithVersion;
  const pkg = `${scope}/${name}`;

  const subpath = parts.slice(2).join('/');
  return { pkg, subpath };
}

/**
 * Resolve the entry file path for a package on disk
 * @param pieElementsNgPath - Root path to the pie-elements-ng repository
 * @param pkg - Package name (e.g., "@pie-element/hotspot")
 * @param subpath - Subpath within the package (e.g., "controller/index")
 * @returns The absolute file path, or null if not found
 */
export async function resolveEntryFile(
  pieElementsNgPath: string,
  pkg: string,
  subpath: string
): Promise<string | null> {
  const [scope, name] = pkg.split('/') as [string, string];

  let base: string;
  if (scope === '@pie-element') {
    base = path.join(pieElementsNgPath, 'packages', 'elements-react', name, 'dist');
  } else if (scope === '@pie-lib') {
    base = path.join(pieElementsNgPath, 'packages', 'lib-react', name, 'dist');
  } else if (scope === '@pie-elements-ng') {
    // @pie-elements-ng/shared-* packages are in packages/shared/
    // e.g. @pie-elements-ng/shared-math-rendering -> packages/shared/math-rendering
    const packageName = name.replace(/^shared-/, '');
    base = path.join(pieElementsNgPath, 'packages', 'shared', packageName, 'dist');
  } else if (scope === '@pie-framework') {
    // @pie-framework packages are also in packages/shared/
    // e.g. @pie-framework/pie-player-events -> packages/shared/player-events
    const packageName = name.replace(/^pie-/, '');
    base = path.join(pieElementsNgPath, 'packages', 'shared', packageName, 'dist');
  } else {
    return null;
  }

  const normalizedSubpath = subpath.replace(/^\/+/, '').replace(/\/+$/, '');

  const buildCandidates = (basePath: string, targetSubpath: string): string[] => {
    const list: string[] = [];
    if (!targetSubpath) {
      return list;
    }

    // Try the path as-is first (for files that already have extensions like .js)
    list.push(path.join(basePath, targetSubpath));

    // Common build layouts: dist/<sub>/index.js or dist/<sub>.js
    list.push(path.join(basePath, targetSubpath, 'index.js'));
    list.push(path.join(basePath, `${targetSubpath}.js`));
    list.push(path.join(basePath, targetSubpath, 'index.mjs'));
    list.push(path.join(basePath, `${targetSubpath}.mjs`));

    // Some builds may output dist/<subpath>/index.js even for nested paths
    const nested = targetSubpath.split('/');
    if (nested.length > 1) {
      list.push(path.join(basePath, ...nested, 'index.js'));
      list.push(path.join(basePath, ...nested) + '.js');
    }

    return list;
  };

  if (!normalizedSubpath) {
    // Try to read package.json to get the correct entry point
    const packageJsonPath = path.join(path.dirname(base), 'package.json');
    try {
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      // Check exports field first (modern approach)
      if (packageJson.exports?.['.']) {
        const defaultExport =
          typeof packageJson.exports['.'] === 'string'
            ? packageJson.exports['.']
            : packageJson.exports['.'].default;

        if (defaultExport) {
          // Convert relative path to absolute
          const entryPath = path.join(path.dirname(base), defaultExport);
          if (await fileExists(entryPath)) {
            return entryPath;
          }
        }
      }

      // Fallback to main field
      if (packageJson.main) {
        const mainPath = path.join(path.dirname(base), packageJson.main);
        if (await fileExists(mainPath)) {
          return mainPath;
        }
      }
    } catch (err) {
      // If package.json doesn't exist or can't be read, continue with fallback candidates
    }

    // Fallback candidates
    const rootCandidates = [path.join(base, 'index.js'), path.join(base, 'index.mjs')];
    for (const c of rootCandidates) {
      if (await fileExists(c)) return c;
    }
  } else {
    const candidates = buildCandidates(base, normalizedSubpath);
    for (const c of candidates) {
      if (await fileExists(c)) return c;
    }

    // Controller/configure fallback for controller-local imports (e.g. defaults.js, utils.js)
    if (!normalizedSubpath.startsWith('controller/')) {
      const controllerCandidates = buildCandidates(base, path.join('controller', normalizedSubpath));
      for (const c of controllerCandidates) {
        if (await fileExists(c)) return c;
      }
    }
    if (!normalizedSubpath.startsWith('configure/')) {
      const configureCandidates = buildCandidates(base, path.join('configure', normalizedSubpath));
      for (const c of configureCandidates) {
        if (await fileExists(c)) return c;
      }
    }
  }
  return null;
}
