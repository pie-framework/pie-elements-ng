import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENT_REGISTRY } from '../elements/registry';

interface PackageExports {
  [key: string]: unknown;
}

interface ElementPackageJson {
  name?: string;
  version?: string;
  exports?: PackageExports;
}

export interface ReactElementMatrixEntry {
  name: string;
  packageName: string;
  version: string;
  hasAuthor: boolean;
  hasController: boolean;
  hasSession: boolean;
  hasPrint: boolean;
  packageDir: string;
  iifeConfigPath: string;
}

function resolveDefaultWorkspaceRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return join(currentDir, '..', '..', '..', '..', '..');
}

function readJsonFile(path: string): ElementPackageJson {
  return JSON.parse(readFileSync(path, 'utf-8')) as ElementPackageJson;
}

export function loadReactElementMatrix(workspaceRoot: string = resolveDefaultWorkspaceRoot()) {
  const elementsDir = join(workspaceRoot, 'packages', 'elements-react');
  if (!existsSync(elementsDir)) {
    throw new Error(`React elements directory not found: ${elementsDir}`);
  }

  const registryByName = new Map(ELEMENT_REGISTRY.map((entry) => [entry.name, entry]));
  const entries: ReactElementMatrixEntry[] = [];

  for (const dirName of readdirSync(elementsDir)) {
    const packageDir = join(elementsDir, dirName);
    const packageJsonPath = join(packageDir, 'package.json');
    const iifeConfigPath = join(packageDir, 'vite.config.iife.ts');

    if (!existsSync(packageJsonPath) || !existsSync(iifeConfigPath)) {
      continue;
    }

    const pkg = readJsonFile(packageJsonPath);
    const packageName = pkg.name;
    if (!packageName?.startsWith('@pie-element/')) {
      continue;
    }

    const name = packageName.replace('@pie-element/', '');
    const metadata = registryByName.get(name);

    entries.push({
      name,
      packageName,
      version: pkg.version || '0.1.0',
      hasAuthor: Boolean(pkg.exports?.['./author']),
      hasController: Boolean(pkg.exports?.['./controller']),
      hasSession: metadata?.hasSession ?? true,
      hasPrint: metadata?.hasPrint ?? false,
      packageDir,
      iifeConfigPath,
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}
