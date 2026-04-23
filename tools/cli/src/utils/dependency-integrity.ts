import { createRequire, builtinModules } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { init, parse } from 'es-module-lexer';
import { loadPackageJson, type PackageJson } from './package-json.js';

export type ImportIntegrityStatus = 'direct' | 'transitive' | 'hoist' | 'broken' | 'peer';

export interface ImportIntegrityIssue {
  dependency: string;
  status: ImportIntegrityStatus;
  declaredDirect: boolean;
  resolvedPath?: string;
  requiredBy?: string;
}

export interface PackageIntegrityResult {
  packageName: string;
  packagePath: string;
  issues: ImportIntegrityIssue[];
}

const BUILTIN_SET = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);
const VALID_BARE_SPECIFIER = /^(@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)(\/[a-z0-9._-]+)*$/i;
const WORKSPACE_SCAN_PREFIXES = ['packages/', 'apps/', 'tools/'];
const PLACEHOLDER_IMPORT_SPECIFIERS = new Set(['package', 'x']);
const IGNORED_PEER_DEPENDENCIES = new Set([
  'react',
  'react-dom',
  '@emotion/react',
  '@emotion/styled',
  '@emotion/core',
]);
const FALLBACK_DEPENDENCY_VERSIONS: Record<string, string> = {
  'js-combinatorics': '^2.1.2',
  'nested-property': '^4.0.0',
  'prosemirror-state': '^1.4.4',
  '@testing-library/react': '^16.3.2',
  '@testing-library/dom': '^10.4.1',
  '@tiptap/extensions': '^3.20.0',
  '@tiptap/extension-list': '^3.20.0',
  '@tiptap/extension-code-block': '^3.20.0',
  'react-is': '^19.2.0',
  pluralize: '^8.0.0',
};

interface CollectWorkspaceOptions {
  includeNonPackageWorkspaces?: boolean;
}

interface AnalyzeIntegrityOptions {
  includePeerGaps?: boolean;
}

export interface AutoFixDependencyOptions extends CollectWorkspaceOptions {
  packageName?: string;
  includeTransitive?: boolean;
  includePeerGaps?: boolean;
}

export interface AutoFixDependencyResult {
  packagesScanned: number;
  packagesUpdated: number;
  dependenciesAdded: number;
  unresolved: Array<{ packageName: string; dependency: string }>;
}

export async function analyzePackageDependencyIntegrity(
  packagePath: string,
  options: AnalyzeIntegrityOptions = {}
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
  const transitiveNames = await collectTransitiveDependencyNames(
    resolveFromPackage,
    declaredDirect
  );

  const issues: ImportIntegrityIssue[] = [];

  for (const dep of Array.from(importedPackages.keys()).sort()) {
    if (dep === pkgJson.name) {
      continue;
    }

    const direct = declaredDirect.has(dep);
    const specifiers = importedPackages.get(dep) || new Set<string>([dep]);
    const resolvedPath = resolveDependencyFromPackage(resolveFromPackage, dep, specifiers);

    if (!resolvedPath) {
      if (direct) {
        const declaredManifest = resolveDeclaredPackageManifest(resolveFromPackage, dep);
        if (declaredManifest) {
          continue;
        }
      }
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

  if (options.includePeerGaps) {
    const peerIssues = await collectMissingPeerDependencyIssues(
      pkgJson,
      declaredDirect,
      resolveFromPackage
    );
    for (const peerIssue of peerIssues) {
      const alreadyReported = issues.some((issue) => issue.dependency === peerIssue.dependency);
      if (!alreadyReported) {
        issues.push(peerIssue);
      }
    }
  }

  return {
    packageName: pkgJson.name,
    packagePath: absPackagePath,
    issues,
  };
}

export async function collectWorkspacePackageDirs(
  root: string,
  options: CollectWorkspaceOptions = {}
): Promise<string[]> {
  const absRoot = resolve(root);
  const out = new Set<string>();
  const rootPkgPath = join(absRoot, 'package.json');
  const rootPkg = (await loadPackageJson(rootPkgPath)) as
    | (PackageJson & { workspaces?: string[] })
    | null;
  const workspaces = rootPkg?.workspaces || [];

  for (const pattern of workspaces) {
    if (!WORKSPACE_SCAN_PREFIXES.some((prefix) => pattern.startsWith(prefix))) {
      continue;
    }
    const isPackagesWorkspace = pattern.startsWith('packages/');
    if (!isPackagesWorkspace && !options.includeNonPackageWorkspaces) {
      continue;
    }
    const matches = await expandWorkspacePattern(absRoot, pattern);
    for (const match of matches) {
      if (existsSync(join(match, 'package.json'))) {
        out.add(match);
      }
    }
  }

  return Array.from(out).sort();
}

async function expandWorkspacePattern(root: string, pattern: string): Promise<string[]> {
  const normalized = pattern.replace(/\\/g, '/').replace(/\/$/, '');
  if (!normalized.includes('*')) {
    return [join(root, normalized)];
  }

  const [prefix, suffix = ''] = normalized.split('*');
  const prefixPath = join(root, prefix);
  if (!existsSync(prefixPath)) {
    return [];
  }

  const dirEntries = await readdir(prefixPath, { withFileTypes: true });
  const matches: string[] = [];

  for (const entry of dirEntries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidate = join(prefixPath, entry.name, suffix);
    if (existsSync(candidate)) {
      matches.push(candidate);
    }
  }

  return matches;
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

function resolveDeclaredPackageManifest(
  resolveFromPackage: NodeRequire,
  dep: string
): string | null {
  const searchPaths = resolveFromPackage.resolve.paths(dep) || [];
  for (const basePath of searchPaths) {
    const manifestPath = join(basePath, dep, 'package.json');
    if (existsSync(manifestPath)) {
      return manifestPath;
    }
  }
  return null;
}

async function collectMissingPeerDependencyIssues(
  pkgJson: PackageJson,
  declaredDirect: Set<string>,
  resolveFromPackage: NodeRequire
): Promise<ImportIntegrityIssue[]> {
  const issues: ImportIntegrityIssue[] = [];
  const checkedPeers = new Set<string>();

  for (const directDep of Array.from(declaredDirect)) {
    if (!directDep || directDep === pkgJson.name) continue;

    const depRoot = await resolvePackageRoot(resolveFromPackage, directDep);
    const depPkgPath =
      depRoot && existsSync(join(depRoot, 'package.json'))
        ? join(depRoot, 'package.json')
        : resolveDeclaredPackageManifest(resolveFromPackage, directDep);
    if (!depPkgPath || !existsSync(depPkgPath)) {
      continue;
    }

    const depPkg = (await loadPackageJson(depPkgPath).catch(() => null)) as PackageJson | null;
    if (!depPkg?.peerDependencies || typeof depPkg.peerDependencies !== 'object') {
      continue;
    }

    const optionalPeers = new Set<string>(
      Object.entries((depPkg.peerDependenciesMeta as Record<string, { optional?: boolean }>) || {})
        .filter(([, meta]) => meta?.optional)
        .map(([name]) => name)
    );

    for (const peerDep of Object.keys(depPkg.peerDependencies)) {
      if (!peerDep || peerDep === pkgJson.name || optionalPeers.has(peerDep)) continue;
      if (IGNORED_PEER_DEPENDENCIES.has(peerDep)) continue;
      if (declaredDirect.has(peerDep) || checkedPeers.has(peerDep)) continue;
      checkedPeers.add(peerDep);

      const resolvedPath = resolveDependencyFromPackage(
        resolveFromPackage,
        peerDep,
        new Set([peerDep])
      );
      issues.push({
        dependency: peerDep,
        status: 'peer',
        declaredDirect: false,
        resolvedPath: resolvedPath || undefined,
        requiredBy: directDep,
      });
    }
  }

  return issues;
}

async function collectImportedPackages(sourceDir: string): Promise<Map<string, Set<string>>> {
  const files = await listSourceFiles(sourceDir);
  const imported = new Map<string, Set<string>>();

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    if (
      file.includes('/src/lib/element-imports.') ||
      content.includes('AUTO-GENERATED') ||
      content.includes('DO NOT EDIT MANUALLY')
    ) {
      continue;
    }
    for (const importedSpec of await extractBareImports(content)) {
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

async function extractBareImports(
  content: string
): Promise<Array<{ packageName: string; rawSpecifier: string }>> {
  const imports = new Map<string, Set<string>>();
  try {
    await init;
    const [parsedImports] = parse(content);
    for (const parsed of parsedImports) {
      const rawSpecifier = (parsed as { n?: string }).n;
      if (!rawSpecifier) continue;
      const dep = normalizeBarePackageSpecifier(rawSpecifier);
      if (!dep) continue;
      if (!imports.has(dep)) {
        imports.set(dep, new Set<string>());
      }
      imports.get(dep)?.add(rawSpecifier);
    }
  } catch {
    const staticPatterns = [
      /^\s*import\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/gm,
      /^\s*import\s*['"]([^'"]+)['"]/gm,
      /^\s*export\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/gm,
      /(?:^|[^\w$"'`])import\(\s*['"]([^'"]+)['"]\s*\)/gm,
    ];
    for (const pattern of staticPatterns) {
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
  }

  const requireContent = stripComments(content);
  const requirePattern =
    /^\s*(?:const|let|var)?[\w${}\s,*=:.[\]-]*\brequire\(\s*['"]([^'"]+)['"]\s*\)/gm;
  let requireMatch: RegExpExecArray | null = requirePattern.exec(requireContent);
  while (requireMatch !== null) {
    const rawSpecifier = requireMatch[1];
    const dep = normalizeBarePackageSpecifier(rawSpecifier);
    if (dep) {
      if (!imports.has(dep)) {
        imports.set(dep, new Set<string>());
      }
      imports.get(dep)?.add(rawSpecifier);
    }
    requireMatch = requirePattern.exec(requireContent);
  }

  const out: Array<{ packageName: string; rawSpecifier: string }> = [];
  for (const [packageName, specifiers] of imports) {
    for (const rawSpecifier of specifiers) {
      out.push({ packageName, rawSpecifier });
    }
  }
  return out;
}

function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^\\:])\/\/.*$/gm, '$1');
}

function normalizeBarePackageSpecifier(specifier: string): string | null {
  if (
    !specifier ||
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('node:') ||
    specifier.startsWith('$')
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

  if (!VALID_BARE_SPECIFIER.test(specifier)) {
    return null;
  }
  if (PLACEHOLDER_IMPORT_SPECIFIERS.has(specifier)) {
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

export async function autoFixWorkspaceDependencyDeclarations(
  root: string,
  options: AutoFixDependencyOptions = {}
): Promise<AutoFixDependencyResult> {
  const absRoot = resolve(root);
  const packageDirs = await collectWorkspacePackageDirs(absRoot, {
    includeNonPackageWorkspaces: options.includeNonPackageWorkspaces,
  });
  const catalog = await buildDependencyVersionCatalog(absRoot, packageDirs);
  const workspacePackages = await buildWorkspacePackageNameMap(packageDirs);

  let packagesScanned = 0;
  let packagesUpdated = 0;
  let dependenciesAdded = 0;
  const unresolved: Array<{ packageName: string; dependency: string }> = [];

  for (const packageDir of packageDirs) {
    const analysis = await analyzePackageDependencyIntegrity(packageDir, {
      includePeerGaps: options.includePeerGaps,
    });
    if (!analysis) continue;
    if (options.packageName && analysis.packageName !== options.packageName) {
      continue;
    }
    packagesScanned++;

    const pkgJsonPath = join(packageDir, 'package.json');
    const pkgJson = (await loadPackageJson(pkgJsonPath)) as PackageJson | null;
    if (!pkgJson) continue;

    const needs = analysis.issues.filter((issue) => {
      if (issue.declaredDirect) {
        return false;
      }
      if (issue.status === 'hoist' || issue.status === 'broken' || issue.status === 'peer') {
        return true;
      }
      return options.includeTransitive === true && issue.status === 'transitive';
    });

    if (needs.length === 0) {
      continue;
    }

    if (!pkgJson.dependencies || typeof pkgJson.dependencies !== 'object') {
      pkgJson.dependencies = {};
    }
    const deps = pkgJson.dependencies as Record<string, string>;

    let modified = false;
    for (const issue of needs) {
      if (deps[issue.dependency]) {
        continue;
      }

      const version = await resolveDependencyVersionForPackage(
        issue.dependency,
        pkgJsonPath,
        absRoot,
        catalog,
        workspacePackages
      );
      if (!version) {
        unresolved.push({ packageName: analysis.packageName, dependency: issue.dependency });
        continue;
      }

      deps[issue.dependency] = version;
      modified = true;
      dependenciesAdded++;
    }

    if (modified) {
      await writeFile(pkgJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`, 'utf-8');
      packagesUpdated++;
    }
  }

  return {
    packagesScanned,
    packagesUpdated,
    dependenciesAdded,
    unresolved,
  };
}

async function buildWorkspacePackageNameMap(packageDirs: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const packageDir of packageDirs) {
    const pkgPath = join(packageDir, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = (await loadPackageJson(pkgPath)) as PackageJson | null;
    if (pkg?.name) {
      map.set(pkg.name, packageDir);
    }
  }
  return map;
}

async function buildDependencyVersionCatalog(
  rootDir: string,
  packageDirs: string[]
): Promise<Map<string, string>> {
  const catalog = new Map<string, string>();

  const addVersions = (record?: Record<string, string>) => {
    if (!record) return;
    for (const [name, version] of Object.entries(record)) {
      if (!catalog.has(name)) {
        catalog.set(name, version);
      }
    }
  };

  const rootPkgPath = join(rootDir, 'package.json');
  if (existsSync(rootPkgPath)) {
    const rootPkg = (await loadPackageJson(rootPkgPath)) as PackageJson | null;
    if (rootPkg) {
      addVersions(rootPkg.dependencies as Record<string, string> | undefined);
      addVersions(rootPkg.devDependencies as Record<string, string> | undefined);
      addVersions(rootPkg.peerDependencies as Record<string, string> | undefined);
      addVersions(rootPkg.optionalDependencies as Record<string, string> | undefined);
    }
  }

  for (const packageDir of packageDirs) {
    const pkgPath = join(packageDir, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = (await loadPackageJson(pkgPath)) as PackageJson | null;
    if (!pkg) continue;
    addVersions(pkg.dependencies as Record<string, string> | undefined);
    addVersions(pkg.devDependencies as Record<string, string> | undefined);
    addVersions(pkg.peerDependencies as Record<string, string> | undefined);
    addVersions(pkg.optionalDependencies as Record<string, string> | undefined);
  }

  return catalog;
}

async function resolveDependencyVersionForPackage(
  dep: string,
  pkgJsonPath: string,
  rootDir: string,
  catalog: Map<string, string>,
  workspacePackages: Map<string, string>
): Promise<string | null> {
  if (workspacePackages.has(dep)) {
    return 'workspace:*';
  }

  const catalogVersion = catalog.get(dep);
  if (catalogVersion) {
    return catalogVersion;
  }

  if (FALLBACK_DEPENDENCY_VERSIONS[dep]) {
    return FALLBACK_DEPENDENCY_VERSIONS[dep];
  }

  const requireFromPackage = createRequire(pkgJsonPath);
  const packageRoot = await resolvePackageRoot(requireFromPackage, dep);
  if (!packageRoot) {
    return null;
  }

  const depPkgPath = join(packageRoot, 'package.json');
  if (!existsSync(depPkgPath)) {
    return null;
  }

  const depPkg = (await loadPackageJson(depPkgPath)) as PackageJson | null;
  if (!depPkg?.version) {
    return null;
  }

  // Keep workspace references if dependency resolves to local workspace package path.
  if (
    packageRoot.startsWith(join(rootDir, 'packages')) ||
    packageRoot.startsWith(join(rootDir, 'apps'))
  ) {
    return 'workspace:*';
  }

  return `^${depPkg.version}`;
}

async function resolvePackageRoot(
  resolveFromPackage: NodeRequire,
  dep: string
): Promise<string | null> {
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
