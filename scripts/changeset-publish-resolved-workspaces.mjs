import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';

const repoRoot = process.cwd();
const depSections = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'];
const runtimeDepSections = ['dependencies', 'optionalDependencies'];
const publishAttempts = Number(process.env.RELEASE_PUBLISH_ATTEMPTS || 2);
const releaseChannel = String(process.env.RELEASE_CHANNEL || 'auto')
  .trim()
  .toLowerCase();
const explicitPackages = (process.env.RELEASE_PACKAGES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const workspacePatterns = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : [];
const svelteElementRoot = join(repoRoot, 'packages', 'elements-svelte');

const packageJsonPaths = new Set();
for (const workspacePattern of workspacePatterns) {
  const matches = globSync(join(workspacePattern, 'package.json'), {
    cwd: repoRoot,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });
  for (const match of matches) packageJsonPaths.add(match);
}

const localPackages = new Map();
const localPackageJsonPathsByName = new Map();
const privatePackages = new Set();
for (const packageJsonPath of packageJsonPaths) {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (pkg?.name && pkg?.version) {
      localPackages.set(pkg.name, pkg.version);
      localPackageJsonPathsByName.set(pkg.name, packageJsonPath);
      if (pkg.private === true) privatePackages.add(pkg.name);
    }
  } catch {
    // Ignore malformed or non-package manifests.
  }
}

const resolveWorkspaceRange = (workspaceSpecifier, packageName) => {
  const localVersion = localPackages.get(packageName);
  if (!localVersion) return workspaceSpecifier;

  const suffix = workspaceSpecifier.slice('workspace:'.length);
  if (suffix === '*' || suffix === '') return localVersion;
  if (suffix === '^') return `^${localVersion}`;
  if (suffix === '~') return `~${localVersion}`;
  return suffix;
};

const backups = new Map();
const changedFiles = [];

const findWorkspaceRangeViolations = () => {
  const violations = [];

  for (const packageJsonPath of packageJsonPaths) {
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    } catch {
      continue;
    }

    if (!pkg?.name || pkg.private === true) continue;

    for (const section of depSections) {
      const deps = pkg[section];
      if (!deps) continue;

      for (const [name, range] of Object.entries(deps)) {
        if (typeof range === 'string' && range.startsWith('workspace:')) {
          violations.push({
            packageName: pkg.name,
            section,
            dependencyName: name,
            range,
            packageJsonPath,
          });
        }
      }
    }
  }

  return violations;
};

const rewriteWorkspaceRanges = () => {
  for (const packageJsonPath of packageJsonPaths) {
    const original = readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(original);
    let changed = false;

    for (const section of depSections) {
      const deps = pkg[section];
      if (!deps) continue;

      for (const [name, range] of Object.entries(deps)) {
        if (typeof range === 'string' && range.startsWith('workspace:')) {
          const next = resolveWorkspaceRange(range, name);
          if (next !== range) {
            deps[name] = next;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      backups.set(packageJsonPath, original);
      writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
      changedFiles.push(packageJsonPath);
    }
  }
};

const restoreWorkspaceRanges = () => {
  for (const [packageJsonPath, contents] of backups.entries()) {
    writeFileSync(packageJsonPath, contents, 'utf8');
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = (cmd, args, options = {}) => {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
  if (result.error) throw result.error;
  return result;
};

const toLines = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const getCurrentPackageInfo = (packageJsonPath) => {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return {
    name: pkg?.name,
    version: pkg?.version,
    private: pkg?.private === true,
  };
};

const getPackageInfoAtRef = (ref, packageJsonPathRelative) => {
  const result = run('git', ['show', `${ref}:${packageJsonPathRelative}`]);
  if (result.status !== 0) return null;
  try {
    const pkg = JSON.parse(result.stdout);
    return { name: pkg?.name, version: pkg?.version, private: pkg?.private === true };
  } catch {
    return null;
  }
};

const listChangedPackageJsons = () => {
  const unstaged = run('git', [
    'diff',
    '--name-only',
    '--',
    ':(glob)packages/**/package.json',
    ':(glob)tools/**/package.json',
  ]);
  const staged = run('git', [
    'diff',
    '--name-only',
    '--cached',
    '--',
    ':(glob)packages/**/package.json',
    ':(glob)tools/**/package.json',
  ]);

  const paths = [...toLines(unstaged.stdout), ...toLines(staged.stdout)];
  return [...new Set(paths)];
};

const listVersionBumpedPackages = () => {
  const candidates = listChangedPackageJsons();
  const bumped = new Map();

  for (const relativePath of candidates) {
    const absolutePath = join(repoRoot, relativePath);
    const current = getCurrentPackageInfo(absolutePath);
    const atHead = getPackageInfoAtRef('HEAD', relativePath);
    if (!current?.name || current.private) continue;
    if (!atHead || atHead.version !== current.version) {
      bumped.set(current.name, current.version);
    }
  }

  if (bumped.size > 0) return bumped;

  // Fallback for CI publish commits: compare HEAD~1..HEAD
  const rangeDiff = run('git', [
    'diff',
    '--name-only',
    'HEAD~1..HEAD',
    '--',
    ':(glob)packages/**/package.json',
    ':(glob)tools/**/package.json',
  ]);
  const rangePaths = [...new Set(toLines(rangeDiff.stdout))];

  for (const relativePath of rangePaths) {
    const current = getPackageInfoAtRef('HEAD', relativePath);
    const previous = getPackageInfoAtRef('HEAD~1', relativePath);
    if (!current?.name || current.private) continue;
    if (!previous || previous.version !== current.version) {
      bumped.set(current.name, current.version);
    }
  }

  return bumped;
};

const resolveExplicitPackages = () => {
  const selected = new Map();
  const missing = [];
  const privateSelected = [];

  for (const explicitPackage of explicitPackages) {
    if (!localPackageJsonPathsByName.has(explicitPackage)) {
      missing.push(explicitPackage);
    } else if (privatePackages.has(explicitPackage)) {
      privateSelected.push(explicitPackage);
    }
  }

  if (missing.length > 0 || privateSelected.length > 0) {
    const details = [
      ...missing.map((name) => `- ${name}: no workspace package found`),
      ...privateSelected.map((name) => `- ${name}: workspace package is private`),
    ].join('\n');
    throw new Error(`[release] Invalid RELEASE_PACKAGES selection:\n${details}`);
  }

  for (const packageJsonPath of packageJsonPaths) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (!pkg?.name || pkg.private === true) continue;
    if (explicitPackages.includes(pkg.name)) {
      selected.set(pkg.name, pkg.version);
    }
  }
  return selected;
};

const parseVersionTag = (version) => {
  const value = String(version || '').trim();
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value);
  if (!match) return null;
  const prerelease = match[4] || '';
  const prereleaseId = prerelease ? prerelease.split('.')[0].toLowerCase() : '';
  return { version: value, prereleaseId };
};

const resolveTagFromVersion = (version) => {
  const parsed = parseVersionTag(version);
  if (!parsed) return 'latest';
  if (!parsed.prereleaseId) return 'latest';
  if (parsed.prereleaseId === 'next') return 'next';
  if (parsed.prereleaseId === 'beta') return 'beta';
  return parsed.prereleaseId;
};

const resolvePublishTag = (version) => {
  const derivedTag = resolveTagFromVersion(version);

  if (releaseChannel === 'auto') return derivedTag;
  if (releaseChannel === 'stable') {
    if (derivedTag !== 'latest') {
      throw new Error(
        `[release] RELEASE_CHANNEL=stable requires stable versions, but got ${version} (derived tag: ${derivedTag})`
      );
    }
    return 'latest';
  }
  if (releaseChannel === 'next') {
    if (derivedTag !== 'next') {
      throw new Error(
        `[release] RELEASE_CHANNEL=next requires next prerelease versions, but got ${version} (derived tag: ${derivedTag})`
      );
    }
    return 'next';
  }
  if (releaseChannel === 'beta') {
    if (derivedTag !== 'beta') {
      throw new Error(
        `[release] RELEASE_CHANNEL=beta requires beta prerelease versions, but got ${version} (derived tag: ${derivedTag})`
      );
    }
    return 'beta';
  }

  throw new Error(
    `[release] Unsupported RELEASE_CHANNEL="${releaseChannel}". Expected one of: auto, stable, next, beta`
  );
};

const hasPublishedVersion = (packageName, version) => {
  const result = run('npm', ['view', `${packageName}@${version}`, 'version', '--json']);
  if (result.status !== 0) return false;
  const text = String(result.stdout || '').trim();
  if (!text) return false;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.includes(version);
    return String(parsed || '').trim() === version;
  } catch {
    return text === version;
  }
};

const readWorkspacePackage = (packageName) => {
  const packageJsonPath = localPackageJsonPathsByName.get(packageName);
  if (!packageJsonPath) return null;
  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  } catch {
    return null;
  }
};

const getWorkspacePackageDir = (packageName) => {
  const packageJsonPath = localPackageJsonPathsByName.get(packageName);
  if (!packageJsonPath) return null;
  return packageJsonPath.slice(0, -'/package.json'.length);
};

const isSvelteElementPackage = (packageName) => {
  const packageDir = getWorkspacePackageDir(packageName);
  if (!packageDir) return false;
  const relative = packageDir.slice(svelteElementRoot.length);
  return packageDir.startsWith(svelteElementRoot) && relative.startsWith('/');
};

const getRuntimeWorkspaceDependencies = (packageName) => {
  const pkg = readWorkspacePackage(packageName);
  if (!pkg) return [];

  const dependencies = [];
  for (const section of runtimeDepSections) {
    const deps = pkg[section];
    if (!deps) continue;

    for (const [dependencyName, range] of Object.entries(deps)) {
      if (localPackages.has(dependencyName)) {
        dependencies.push({
          packageName,
          dependencyName,
          version: localPackages.get(dependencyName),
          section,
          range,
        });
      }
    }
  }

  return dependencies;
};

const collectPackageJsonTargets = (value, out) => {
  if (!value) return;
  if (typeof value === 'string') {
    out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectPackageJsonTargets(entry, out);
    return;
  }
  if (typeof value === 'object') {
    for (const entry of Object.values(value)) collectPackageJsonTargets(entry, out);
  }
};

const collectJsFiles = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      collectJsFiles(fullPath, out);
    } else if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
      out.push(fullPath);
    }
  }
  return out;
};

const parseNpmPackJson = (stdout) => {
  const text = String(stdout || '');
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < start) {
    throw new Error('npm pack --dry-run --json did not return a JSON payload');
  }
  return JSON.parse(text.slice(start, end + 1));
};

const getPackedFiles = (packageName) => {
  const result = run('npm', ['pack', '--dry-run', '--json', '--workspace', packageName]);
  if (result.status !== 0) {
    throw new Error(
      `[release] npm pack dry-run failed for ${packageName}:\n${result.stderr || result.stdout}`
    );
  }
  const packData = parseNpmPackJson(result.stdout);
  return new Set((packData?.[0]?.files || []).map((entry) => entry.path).filter(Boolean));
};

const hasRealSvelteImport = (source) => {
  const importPattern = /^\s*import\s+(?:[^'"]+from\s+)?['"](@?svelte(?:\/[^'"]*)?)['"]/gm;
  return importPattern.test(source);
};

const formatExamples = (items, limit = 5) => {
  const values = [...items].sort();
  const suffix = values.length > limit ? `, ... ${values.length - limit} more` : '';
  return `${values.slice(0, limit).join(', ')}${suffix}`;
};

const assertSvelteElementPublishSurface = (targetPackages) => {
  const violations = [];
  let checked = 0;

  for (const packageName of targetPackages.keys()) {
    if (!isSvelteElementPackage(packageName)) continue;
    checked += 1;

    const pkg = readWorkspacePackage(packageName);
    const packageDir = getWorkspacePackageDir(packageName);
    if (!pkg || !packageDir) continue;

    for (const section of ['dependencies', 'optionalDependencies']) {
      if (pkg[section]?.svelte) {
        violations.push(
          `${packageName}: ${section}.svelte is not allowed; Svelte element runtime entries must bundle Svelte`
        );
      }
    }

    if (pkg.peerDependencies?.svelte) {
      violations.push(
        `${packageName}: peerDependencies.svelte leaks a Svelte requirement to non-Svelte hosts; remove it unless this package intentionally publishes raw Svelte source exports`
      );
    }

    if (
      Array.isArray(pkg.files) &&
      pkg.files.some((entry) => String(entry).replace(/^\.\//, '') === 'src')
    ) {
      violations.push(
        `${packageName}: files[] includes "src", which publishes raw Svelte source and tests`
      );
    }

    const declaredTargets = new Set();
    collectPackageJsonTargets(pkg.exports, declaredTargets);
    for (const field of ['main', 'module', 'types', 'svelte']) {
      if (pkg[field]) declaredTargets.add(pkg[field]);
    }
    for (const target of declaredTargets) {
      if (typeof target !== 'string') continue;
      const normalized = target.replace(/^\.\//, '');
      if (normalized.startsWith('src/')) {
        violations.push(`${packageName}: package export points at source path ${target}`);
      }
      if (normalized.endsWith('.svelte') || normalized.includes('.svelte?')) {
        violations.push(`${packageName}: package export exposes Svelte component source ${target}`);
      }
    }

    const packedFiles = getPackedFiles(packageName);
    const packedSourceFiles = [];
    const packedTestArtifacts = [];
    for (const packedFile of packedFiles) {
      if (packedFile.startsWith('src/')) {
        packedSourceFiles.push(packedFile);
      }
      if (/(^|\/).+\.test\.(?:[cm]?[jt]sx?|d\.ts)(?:\.map)?$/.test(packedFile)) {
        packedTestArtifacts.push(packedFile);
      }
    }
    if (packedSourceFiles.length > 0) {
      violations.push(
        `${packageName}: packed tarball includes ${packedSourceFiles.length} source file(s), e.g. ${formatExamples(packedSourceFiles)}`
      );
    }
    if (packedTestArtifacts.length > 0) {
      violations.push(
        `${packageName}: packed tarball includes ${packedTestArtifacts.length} test artifact(s), e.g. ${formatExamples(packedTestArtifacts)}`
      );
    }

    const distDir = join(packageDir, 'dist');
    if (!existsSync(distDir)) {
      violations.push(`${packageName}: missing dist directory; run build before publish`);
    } else {
      for (const jsFile of collectJsFiles(distDir)) {
        const source = readFileSync(jsFile, 'utf8');
        if (hasRealSvelteImport(source)) {
          violations.push(
            `${packageName}: built artifact ${jsFile.slice(packageDir.length + 1)} imports Svelte at runtime`
          );
        }
        if (source.includes('customElements.define(')) {
          violations.push(
            `${packageName}: built artifact ${jsFile.slice(packageDir.length + 1)} calls customElements.define(...)`
          );
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `[release] Refusing to publish because selected Svelte element package(s) have publish-surface violations:\n${violations
        .map((violation) => `- ${violation}`)
        .join('\n')}`
    );
  }

  if (checked > 0) {
    console.log(
      `[release] Svelte element publish-surface preflight passed (${checked} package(s))`
    );
  }
};

const collectRuntimeWorkspaceDependencyClosure = (targetPackages) => {
  const dependenciesByName = new Map();
  const visited = new Set();
  const stack = [...targetPackages.keys()];

  while (stack.length > 0) {
    const packageName = stack.pop();
    if (!packageName || visited.has(packageName)) continue;
    visited.add(packageName);

    for (const dependency of getRuntimeWorkspaceDependencies(packageName)) {
      const existing = dependenciesByName.get(dependency.dependencyName);
      if (existing) {
        existing.requiredBy.add(packageName);
      } else {
        dependenciesByName.set(dependency.dependencyName, {
          name: dependency.dependencyName,
          version: dependency.version,
          requiredBy: new Set([packageName]),
          private: privatePackages.has(dependency.dependencyName),
        });
      }

      // Only recurse into a workspace dep if it is also being published in this
      // run. If it is already on npm at the correct version, its published
      // manifest has already-resolved (non-workspace) deps — there is no need
      // to walk its local workspace package.json, and doing so would
      // incorrectly flag transitive workspace:* refs that are irrelevant to
      // the consumer (e.g. @pie-lib/render-ui@6.1.0 on npm having a local
      // workspace:* on @pie-lib/math-rendering which hasn't been republished).
      if (targetPackages.has(dependency.dependencyName)) {
        stack.push(dependency.dependencyName);
      }
    }
  }

  return dependenciesByName;
};

const assertRuntimeWorkspaceDependenciesPublishable = (targetPackages) => {
  const dependencyClosure = collectRuntimeWorkspaceDependencyClosure(targetPackages);
  const unpublished = [];
  const privateDeps = [];

  for (const dependency of dependencyClosure.values()) {
    if (targetPackages.has(dependency.name)) continue;

    const requiredBy = [...dependency.requiredBy].sort().join(', ');
    if (dependency.private) {
      privateDeps.push({ ...dependency, requiredBy });
      continue;
    }

    if (!hasPublishedVersion(dependency.name, dependency.version)) {
      unpublished.push({ ...dependency, requiredBy });
    }
  }

  if (privateDeps.length === 0 && unpublished.length === 0) return;

  const details = [
    ...privateDeps.map(
      (dep) =>
        `- ${dep.name}@${dep.version}: private workspace dependency required by ${dep.requiredBy}`
    ),
    ...unpublished.map(
      (dep) =>
        `- ${dep.name}@${dep.version}: not published to npm and not selected for this publish (required by ${dep.requiredBy})`
    ),
  ].join('\n');
  const suggestedPackages = [...new Set(unpublished.map((dep) => dep.name))].sort();
  const suggestion =
    suggestedPackages.length > 0
      ? `\n\nPublish or include the missing dependency package(s) first. For a targeted release, add them explicitly, e.g. RELEASE_PACKAGES=${[
          ...suggestedPackages,
          ...targetPackages.keys(),
        ].join(',')}`
      : '';

  throw new Error(
    `[release] Refusing to publish because selected package(s) have unpublished workspace runtime dependencies:\n${details}${suggestion}`
  );
};

const sortTargetsByRuntimeWorkspaceDependencies = (targetPackages) => {
  const sorted = [];
  const visiting = new Set();
  const visited = new Set();

  const visit = (packageName, path = []) => {
    if (visited.has(packageName)) return;
    if (visiting.has(packageName)) {
      throw new Error(
        `[release] Cannot determine publish order due to runtime workspace dependency cycle: ${[
          ...path,
          packageName,
        ].join(' -> ')}`
      );
    }

    visiting.add(packageName);
    for (const dependency of getRuntimeWorkspaceDependencies(packageName)) {
      if (targetPackages.has(dependency.dependencyName)) {
        visit(dependency.dependencyName, [...path, packageName]);
      }
    }
    visiting.delete(packageName);
    visited.add(packageName);
    sorted.push({ name: packageName, version: targetPackages.get(packageName) });
  };

  for (const packageName of targetPackages.keys()) {
    visit(packageName);
  }

  return sorted;
};

const publishWorkspaceOnce = ({ packageName, version, publishTag }) =>
  new Promise((resolve, reject) => {
    console.log(`[release] Publishing ${packageName}@${version} with npm tag "${publishTag}"`);
    const child = spawn(
      'npm',
      ['publish', '--workspace', packageName, '--access', 'public', '--tag', publishTag],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env: process.env,
      }
    );

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm publish failed for ${packageName} with code ${code}`));
    });
    child.on('error', reject);
  });

const publishWorkspaceWithRetry = async ({ packageName, version, publishTag }) => {
  let lastError;

  for (let attempt = 1; attempt <= publishAttempts; attempt++) {
    try {
      console.log(
        `[release] Publishing ${packageName}@${version} (tag=${publishTag}, attempt ${attempt}/${publishAttempts})`
      );
      await publishWorkspaceOnce({ packageName, version, publishTag });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === publishAttempts) break;
      console.warn(
        `[release] publish failed for ${packageName} on attempt ${attempt}; retrying in 5s...`
      );
      await sleep(5000);
    }
  }

  throw lastError || new Error(`publish failed for ${packageName}`);
};

try {
  rewriteWorkspaceRanges();
  if (changedFiles.length > 0) {
    console.log(
      `[release] Rewrote workspace ranges in ${changedFiles.length} package.json file(s) for publish`
    );
  }

  const violations = findWorkspaceRangeViolations();
  if (violations.length > 0) {
    const details = violations
      .map(
        (v) =>
          `- ${v.packageName}: ${v.section}.${v.dependencyName}=${v.range} (${v.packageJsonPath})`
      )
      .join('\n');
    throw new Error(
      `[release] Cannot publish while workspace ranges remain in non-private packages:\n${details}`
    );
  }

  const targetPackages =
    explicitPackages.length > 0 ? resolveExplicitPackages() : listVersionBumpedPackages();

  if (targetPackages.size === 0) {
    const explicitHint =
      explicitPackages.length > 0
        ? ` (requested RELEASE_PACKAGES=${explicitPackages.join(',')})`
        : '';
    throw new Error(
      `[release] No version-bumped publish targets found${explicitHint}. Refusing to publish all packages.`
    );
  }

  const packageList = [...targetPackages.entries()].map(([name, version]) => ({ name, version }));
  console.log(
    `[release] Selected publish targets (${packageList.length}): ${packageList
      .map((p) => `${p.name}@${p.version}`)
      .join(', ')}`
  );
  console.log(`[release] Using RELEASE_CHANNEL=${releaseChannel}`);
  assertRuntimeWorkspaceDependenciesPublishable(targetPackages);
  assertSvelteElementPublishSurface(targetPackages);

  const publishOrder = sortTargetsByRuntimeWorkspaceDependencies(targetPackages);
  if (publishOrder.map((p) => p.name).join(',') !== packageList.map((p) => p.name).join(',')) {
    console.log(
      `[release] Dependency-aware publish order: ${publishOrder
        .map((p) => `${p.name}@${p.version}`)
        .join(', ')}`
    );
  }

  for (const { name, version } of publishOrder) {
    const publishTag = resolvePublishTag(version);
    const published = hasPublishedVersion(name, version);
    if (published === true) {
      console.log(`[release] Skipping ${name}@${version} (already published)`);
      continue;
    }
    await publishWorkspaceWithRetry({ packageName: name, version, publishTag });
  }
} finally {
  restoreWorkspaceRanges();
  if (changedFiles.length > 0) {
    console.log('[release] Restored workspace ranges after publish');
  }
}
