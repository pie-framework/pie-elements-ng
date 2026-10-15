import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** The export every `./browser/*` module carries: the package it was built from. */
export const PACKAGE_IDENTITY_EXPORT = 'piePackage';

export type PackageIdentity = { name: string; version: string };

/** The name and version of the package at `packageDir`, from its manifest. */
export function readPackageIdentity(packageDir: string): PackageIdentity {
  const { name, version } = JSON.parse(
    readFileSync(resolve(packageDir, 'package.json'), 'utf-8')
  ) as Partial<PackageIdentity>;
  if (typeof name !== 'string' || !name || typeof version !== 'string' || !version) {
    throw new Error(`${packageDir}/package.json needs a name and a version`);
  }
  return { name, version };
}

/**
 * Adds `export const piePackage = { name, version }` to each entry, so a host that bundles the
 * module registers it without restating the package and version it installed. The release
 * workflow versions packages before it builds them, so the version is the one published.
 */
export function browserPackageIdentity(
  identity: PackageIdentity,
  entryFiles: Iterable<string>
): Plugin {
  const entries = new Set(entryFiles);
  const declaration =
    `\nexport const ${PACKAGE_IDENTITY_EXPORT} = Object.freeze(` +
    `${JSON.stringify({ name: identity.name, version: identity.version })});\n`;
  return {
    name: 'pie-browser-package-identity',
    transform(code, id) {
      if (!entries.has(id.split('?')[0])) return null;
      // Appended code moves nothing, so the module's source map stays valid.
      return { code: code + declaration, map: null };
    },
  };
}
