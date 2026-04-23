import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ElementPackageInfo, PieElementFramework } from './types.js';

interface DiscoverOptions {
  rootDir: string;
  frameworkFilter: PieElementFramework | 'all';
  elementFilter?: string;
}

const ELEMENT_PREFIX = '@pie-element/';

const FRAMEWORK_DIRS: Record<PieElementFramework, string> = {
  react: 'packages/elements-react',
  svelte: 'packages/elements-svelte',
};

export const CONTRACT_FILENAME = 'docs.contract.json';

const safeReadPackageJson = async (
  packageJsonPath: string
): Promise<Record<string, unknown> | null> => {
  try {
    const content = await readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const coerceRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const discoverElementPackages = async (
  options: DiscoverOptions
): Promise<ElementPackageInfo[]> => {
  const frameworks: PieElementFramework[] =
    options.frameworkFilter === 'all'
      ? (Object.keys(FRAMEWORK_DIRS) as PieElementFramework[])
      : [options.frameworkFilter];

  const results: ElementPackageInfo[] = [];

  for (const framework of frameworks) {
    const frameworkDir = join(options.rootDir, FRAMEWORK_DIRS[framework]);
    if (!existsSync(frameworkDir)) {
      continue;
    }

    const packageDirs = await readdir(frameworkDir);
    for (const dirName of packageDirs) {
      const packageDir = join(frameworkDir, dirName);
      const packageJsonPath = join(packageDir, 'package.json');
      if (!existsSync(packageJsonPath)) {
        continue;
      }

      const pkg = await safeReadPackageJson(packageJsonPath);
      if (!pkg) {
        continue;
      }

      const packageName = typeof pkg.name === 'string' ? pkg.name : '';
      if (!packageName.startsWith(ELEMENT_PREFIX)) {
        continue;
      }

      const elementName = packageName.slice(ELEMENT_PREFIX.length).trim();
      if (!elementName) {
        continue;
      }

      if (options.elementFilter && options.elementFilter !== elementName) {
        continue;
      }

      results.push({
        elementName,
        packageName,
        framework,
        packageDir,
        packageDescription: typeof pkg.description === 'string' ? pkg.description : undefined,
        exportsMap: coerceRecord(pkg.exports),
      });
    }
  }

  return results.sort((a, b) => a.elementName.localeCompare(b.elementName));
};

export const inferViewsFromPackageExports = (exportsMap?: Record<string, unknown>): string[] => {
  if (!exportsMap) {
    return ['delivery'];
  }

  const views = new Set<string>();
  for (const key of Object.keys(exportsMap)) {
    if (!key.startsWith('./')) {
      continue;
    }
    const view = key.replace('./', '').trim();
    if (!view || view === 'controller') {
      continue;
    }
    views.add(view);
  }

  if (views.size === 0) {
    views.add('delivery');
  }

  return Array.from(views).sort();
};
