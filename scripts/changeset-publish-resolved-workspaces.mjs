import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';

const repoRoot = process.cwd();
const depSections = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'];

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

const runChangesetPublish = () =>
  new Promise((resolve, reject) => {
    const child = spawn('bunx', ['changeset', 'publish'], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`changeset publish exited with code ${code}`));
    });
    child.on('error', reject);
  });

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

  await runChangesetPublish();
} finally {
  restoreWorkspaceRanges();
  if (changedFiles.length > 0) {
    console.log('[release] Restored workspace ranges after publish');
  }
}
