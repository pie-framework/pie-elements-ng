import { createRequire, builtinModules } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { loadPackageJson, type PackageJson } from './package-json.js';

export type ImportIntegrityStatus = 'direct' | 'transitive' | 'hoist' | 'broken';

export interface ImportIntegrityIssue {
  dependency: string;
  status: ImportIntegrityStatus;
  declaredDirect: boolean;
  resolvedPath?: string;
}

export interface PackageIntegrityResult {
  packageName: string;
  packagePath: string;
  issues: ImportIntegrityIssue[];
}

const BUILTIN_SET = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);

export async function analyzePackageDependencyIntegrity(
  packagePath: string
): Promise<PackageIntegrityResult | null> {
  const absPackagePath = resolve(packagePath);
  const pkgJsonPath = join(absPackagePath, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    return null;
  }

  const pkgJson = (await loadPackageJson(pkgJsonPath)) as PackageJson | null;
  if (!pkgJson || !pkgJson.name) {
    return null;
  }

  const sourceDir = join(absPackagePath, 'src');
  if (!existsSync(sourceDir)) {
    return {
      packageName: pkgJson.name,
      packagePath: absPackagePath,
      issues: [],
    };
  }

  const importedPackages = await collectImportedPackages(sourceDir);
  const declaredDirect = new Set<string>([
    ...Object.keys(pkgJson.dependencies || {}),
    ...Object.keys(pkgJson.devDependencies || {}),
    ...Object.keys((pkgJson.peerDependencies as Record<string, string> | undefined) || {}),
    ...Object.keys((pkgJson.optionalDependencies as Record<string, string> | undefined) || {}),
  ]);

  const resolveFromPackage = createRequire(pkgJsonPath);
  const transitiveNames = await collectTransitiveDependencyNames(resolveFromPackage, declaredDirect);

  const issues: ImportIntegrityIssue[] = [];

  for (const dep of Array.from(importedPackages.keys()).sort()) {
    const direct = declaredDirect.has(dep);
    const specifiers = importedPackages.get(dep) || new Set<string>([dep]);
    const resolvedPath = resolveDependencyFromPackage(resolveFromPackage, dep, specifiers);

    if (!resolvedPath) {
      issues.push({
        dependency: dep,
        status: 'broken',
        declaredDirect: direct,
      });
      continue;
    }

    if (direct) {
      continue;
    }

    if (transitiveNames.has(dep)) {
      issues.push({
        dependency: dep,
        status: 'transitive',
        declaredDirect: false,
        resolvedPath,
      });
    } else {
      issues.push({
        dependency: dep,
        status: 'hoist',
        declaredDirect: false,
        resolvedPath,
      });
    }
  }

  return {
    packageName: pkgJson.name,
    packagePath: absPackagePath,
    issues,
  };
}

export async function collectWorkspacePackageDirs(root: string): Promise<string[]> {
  const absRoot = resolve(root);
  const out: string[] = [];
  const roots = [join(absRoot, 'packages/elements-react'), join(absRoot, 'packages/lib-react')];

  for (const parent of roots) {
    if (!existsSync(parent)) continue;
    const names = await readdir(parent);
    for (const name of names) {
      const pkgDir = join(parent, name);
      if (existsSync(join(pkgDir, 'package.json'))) {
        out.push(pkgDir);
      }
    }
  }

  return out.sort();
}

function resolveDependencyFromPackage(
  resolveFromPackage: NodeRequire,
  dep: string,
  specifiers: Set<string>
): string | null {
  const candidates = new Set<string>([...specifiers, dep]);
  for (const candidate of candidates) {
    try {
      return resolveFromPackage.resolve(candidate);
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function collectImportedPackages(sourceDir: string): Promise<Map<string, Set<string>>> {
  const files = await listSourceFiles(sourceDir);
  const imported = new Map<string, Set<string>>();

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    for (const importedSpec of extractBareImports(content)) {
      if (!imported.has(importedSpec.packageName)) {
        imported.set(importedSpec.packageName, new Set<string>());
      }
      imported.get(importedSpec.packageName)?.add(importedSpec.rawSpecifier);
    }
  }

  return imported;
}

async function listSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(fullPath)));
      continue;
    }

    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractBareImports(
  content: string
): Array<{ packageName: string; rawSpecifier: string }> {
  const imports = new Map<string, Set<string>>();
  const patterns = [
    /import\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/g,
    /import\s*['"]([^'"]+)['"]/g,
    /export\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null = pattern.exec(content);
    while (match !== null) {
      const rawSpecifier = match[1];
      const dep = normalizeBarePackageSpecifier(rawSpecifier);
      if (dep) {
        if (!imports.has(dep)) {
          imports.set(dep, new Set<string>());
        }
        imports.get(dep)?.add(rawSpecifier);
      }
      match = pattern.exec(content);
    }
  }

  const out: Array<{ packageName: string; rawSpecifier: string }> = [];
  for (const [packageName, specifiers] of imports) {
    for (const rawSpecifier of specifiers) {
      out.push({ packageName, rawSpecifier });
    }
  }
  return out;
}

function normalizeBarePackageSpecifier(specifier: string): string | null {
  if (
    !specifier ||
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('node:')
  ) {
    return null;
  }

  if (BUILTIN_SET.has(specifier)) {
    return null;
  }

  // Ignore virtual modules and URL/protocol specifiers.
  if (specifier.includes(':')) {
    return null;
  }

  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  }

  return specifier.split('/')[0] || null;
}

async function collectTransitiveDependencyNames(
  resolveFromPackage: NodeRequire,
  roots: Set<string>
): Promise<Set<string>> {
  const seen = new Set<string>();
  const queue = Array.from(roots);
  const transitive = new Set<string>();

  while (queue.length > 0) {
    const dep = queue.shift();
    if (!dep || seen.has(dep)) continue;
    seen.add(dep);
    transitive.add(dep);

    const root = await resolvePackageRoot(resolveFromPackage, dep);
    if (!root) continue;

    const pkgJsonPath = join(root, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    let pkg: PackageJson | null = null;
    try {
      pkg = (await loadPackageJson(pkgJsonPath)) as PackageJson;
    } catch {
      pkg = null;
    }

    if (!pkg) continue;

    const childDeps = Object.keys(pkg.dependencies || {});
    for (const child of childDeps) {
      if (!seen.has(child)) queue.push(child);
    }
  }

  return transitive;
}

async function resolvePackageRoot(resolveFromPackage: NodeRequire, dep: string): Promise<string | null> {
  let resolvedFile: string;
  try {
    resolvedFile = resolveFromPackage.resolve(dep);
  } catch {
    return null;
  }

  let current = dirname(resolvedFile);
  const floor = dirname(current);
  while (current !== floor) {
    const pkgJsonPath = join(current, 'package.json');
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = (await loadPackageJson(pkgJsonPath)) as PackageJson;
        if (pkg.name === dep) {
          return current;
        }
      } catch {
        // ignore parse/load errors and keep walking
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}
