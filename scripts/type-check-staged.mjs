#!/usr/bin/env node

// The pre-commit type check. The root tsconfig.json has no inputs, so a root `tsc` checks nothing;
// each package is type-checked by the `tsc` steps of its own build script. This runs those steps
// with --noEmit for every workspace package that a staged .ts or .tsx path belongs to.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TSC = createRequire(import.meta.url).resolve('typescript/bin/tsc');

// The `tsc` steps of a build script, as argument lists for a `tsc --noEmit` run from the
// repository root.
export function typeCheckArgs(buildScript, packageDir) {
  return buildScript
    .split('&&')
    .map((step) => step.trim().match(/^(?:bunx |bun x )?tsc(?:\s+(.*))?$/))
    .filter(Boolean)
    .map(([, rest = '']) => {
      const args = rest.split(/\s+/).filter((arg) => arg && arg !== '--emitDeclarationOnly');
      const project = args.findIndex((arg) => arg === '-p' || arg === '--project');
      if (project === -1) args.push('-p', packageDir);
      else args[project + 1] = path.join(packageDir, args[project + 1]);
      return [...args, '--noEmit'];
    });
}

// The nearest directory above a repository path that holds a package.json, short of the root.
function packageDirOf(root, file) {
  for (let dir = path.dirname(file); dir !== '.'; dir = path.dirname(dir)) {
    if (existsSync(path.join(root, dir, 'package.json'))) return dir;
  }
  return null;
}

// The type checks that a set of staged paths calls for, and the staged paths that no package
// build type-checks: packages whose build runs no `tsc`, and files outside every package.
export function planTypeChecks(files, root = ROOT) {
  const checks = [];
  const unchecked = [];
  const planned = new Set();
  for (const file of files.filter((name) => /\.tsx?$/.test(name))) {
    const dir = packageDirOf(root, file);
    if (dir === null) {
      unchecked.push(file);
      continue;
    }
    if (planned.has(dir)) continue;
    planned.add(dir);
    const manifest = JSON.parse(readFileSync(path.join(root, dir, 'package.json'), 'utf8'));
    const runs = typeCheckArgs(manifest.scripts?.build ?? '', dir);
    if (runs.length === 0) unchecked.push(dir);
    const workspaceDependencies = Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
    })
      .filter(([, spec]) => spec.startsWith('workspace:'))
      .map(([name]) => name);
    for (const args of runs) checks.push({ name: manifest.name, args, workspaceDependencies });
  }
  return { checks, unchecked };
}

// The workspace dependencies a tsc report names. tsc reads them from their build output, so an
// error naming one can come from a dependency that is unbuilt or built from older sources.
export function namedDependencies(output, workspaceDependencies) {
  return workspaceDependencies.filter((name) =>
    new RegExp(`['"]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"/]`).test(output)
  );
}

function runTsc(args) {
  return new Promise((resolve) => {
    const started = performance.now();
    const child = spawn(process.execPath, [TSC, ...args], { cwd: ROOT });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    const finish = (ok) =>
      resolve({ ok, output, seconds: ((performance.now() - started) / 1000).toFixed(1) });
    child.on('error', (error) => {
      output += `${error.message}\n`;
      finish(false);
    });
    child.on('close', (code) => finish(code === 0));
  });
}

async function main() {
  // --no-renames lists a rename as a deletion and an addition, so both packages get checked.
  const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--no-renames', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
  const { checks, unchecked } = planTypeChecks(staged);
  if (unchecked.length > 0) {
    console.log(`Not type-checked, as no package build runs tsc on them: ${unchecked.join(', ')}`);
  }

  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < checks.length) {
      const index = next++;
      results[index] = await runTsc(checks[index].args);
    }
  };
  await Promise.all(Array.from({ length: availableParallelism() }, worker));

  checks.forEach(({ name, args, workspaceDependencies }, index) => {
    const { ok, output, seconds } = results[index];
    console.log(`${ok ? '✓' : '✗'} tsc ${args.join(' ')} (${seconds}s)`);
    if (ok) return;
    process.exitCode = 1;
    process.stdout.write(output);
    const named = namedDependencies(output, workspaceDependencies);
    if (named.length > 0) {
      console.log(
        `The errors name ${named.join(', ')}, which tsc reads from build output. If that output is missing or stale, rebuild it: bunx turbo run build --filter='${name}^...'`
      );
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
