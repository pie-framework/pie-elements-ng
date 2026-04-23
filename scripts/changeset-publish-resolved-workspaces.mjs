import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';

const repoRoot = process.cwd();
const depSections = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'];
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
for (const packageJsonPath of packageJsonPaths) {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (pkg?.name && pkg?.version) {
      localPackages.set(pkg.name, pkg.version);
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

  for (const { name, version } of packageList) {
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
