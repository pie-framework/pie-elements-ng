import path from 'node:path';
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
  const candidates: string[] = [];

  if (!normalizedSubpath) {
    candidates.push(path.join(base, 'index.js'));
    candidates.push(path.join(base, 'index.mjs'));
  } else {
    // Try the path as-is first (for files that already have extensions like .js)
    candidates.push(path.join(base, normalizedSubpath));

    // Common build layouts: dist/<sub>/index.js or dist/<sub>.js
    candidates.push(path.join(base, normalizedSubpath, 'index.js'));
    candidates.push(path.join(base, `${normalizedSubpath}.js`));
    candidates.push(path.join(base, normalizedSubpath, 'index.mjs'));
    candidates.push(path.join(base, `${normalizedSubpath}.mjs`));

    // Some builds may output dist/<subpath>/index.js even for nested paths
    const nested = normalizedSubpath.split('/');
    if (nested.length > 1) {
      candidates.push(path.join(base, ...nested, 'index.js'));
      candidates.push(path.join(base, ...nested) + '.js');
    }
  }

  for (const c of candidates) {
    if (await fileExists(c)) return c;
  }
  return null;
}
