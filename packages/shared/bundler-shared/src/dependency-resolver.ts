/**
 * Resolve library package versions for webpack aliases
 * Copied from pie-api-aws/packages/bundler/src/dependency.ts
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const BUNDLE_LIB_PACKAGES = ['@pie-lib/pie-toolbox', '@pie-lib/math-rendering'];

export function getLibPackagePathMap(
  workspaceDir: string,
  elements: string[]
): Record<string, string> {
  const searchPaths = [
    join(workspaceDir, 'node_modules'),
    ...elements.flatMap((element) => [
      join(workspaceDir, 'packages', element, 'node_modules'),
      join(workspaceDir, 'packages', element, 'configure', 'node_modules'),
      join(workspaceDir, 'packages', element, 'controller', 'node_modules'),
      join(workspaceDir, 'packages', element, 'author', 'node_modules'),
    ]),
  ];

  const packagePaths: Record<string, string> = {};
  const versionToAliasMap: Record<string, string> = {};

  BUNDLE_LIB_PACKAGES.forEach((libPackage) => {
    searchPaths.forEach((searchPath) => {
      const foundPath = findPackagePath(libPackage, [searchPath]);
      if (!foundPath) return;

      const element = elements.find((el) => searchPath.includes(`packages/${el}`));
      const isConfigure = searchPath.includes('configure');
      const isController = searchPath.includes('controller');
      const isAuthor = searchPath.includes('author');

      // Try reading version
      let version: string | null = null;
      try {
        const pkgJsonPath = join(foundPath, 'package.json');
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
        version = pkgJson.version;
      } catch (e) {
        console.warn(`[dependency-resolver] Could not read version from ${foundPath}/package.json`);
      }

      // Check if we've already used this version
      let aliasKey = versionToAliasMap[version || 'unknown'];
      if (!aliasKey && version) {
        aliasKey = `${libPackage}-v${version}`;
        versionToAliasMap[version] = aliasKey;
        packagePaths[aliasKey] = foundPath;
      }

      if (!element) {
        // Root package
        packagePaths[`${libPackage}-root`] = foundPath;
      } else {
        // Element-specific packages
        if (isConfigure) {
          packagePaths[`${libPackage}-${element}-configure`] = foundPath;
        } else if (isController) {
          packagePaths[`${libPackage}-${element}-controller`] = foundPath;
        } else if (isAuthor) {
          packagePaths[`${libPackage}-${element}-author`] = foundPath;
        } else {
          packagePaths[`${libPackage}-${element}`] = foundPath;
        }
      }
    });
  });

  console.log('[dependency-resolver] Version aliases:', versionToAliasMap);

  return packagePaths;
}

function findPackagePath(packageName: string, searchPaths: string[]): string | null {
  for (const searchPath of searchPaths) {
    try {
      const pkgPath = require.resolve(`${packageName}/package.json`, { paths: [searchPath] });
      return dirname(pkgPath);
    } catch {
      // Continue searching
    }
  }
  return null;
}
