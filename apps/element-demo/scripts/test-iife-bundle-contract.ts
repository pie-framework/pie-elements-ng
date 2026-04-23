import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Bundler, mkDependencyHash, type BuildBundleName } from '@pie-element/element-bundler';
import { loadReactElementMatrix } from '../src/lib/testing/react-element-matrix';
import { createWorkspaceCacheSalt } from '../src/lib/testing/workspace-fingerprint';

interface ContractFailure {
  element: string;
  bundle: BuildBundleName;
  reason: string;
}

function normalizeElementFilter(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }
  return new Set(
    value
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  );
}

function fileNameForBundle(bundle: BuildBundleName): string {
  if (bundle === 'client-player') {
    return 'client-player.js';
  }
  return `${bundle}.js`;
}

function assertBundleContract(
  code: string,
  packageName: string,
  bundle: BuildBundleName,
  hasAuthor: boolean
): string[] {
  const failures: string[] = [];
  if (!code.includes('window.pie')) {
    failures.push('missing window.pie assignment');
  }
  if (!code.includes(packageName)) {
    failures.push(`missing package key ${packageName}`);
  }
  if (!code.includes('Element')) {
    failures.push('missing Element export marker');
  }
  if (bundle === 'client-player' && !code.includes('controller')) {
    failures.push('missing controller export marker');
  }
  if (bundle === 'editor' && hasAuthor && !code.includes('Configure')) {
    failures.push('missing Configure export marker');
  }
  return failures;
}

async function main() {
  const workspaceRoot = join(process.cwd(), '..', '..');
  const elementFilter = normalizeElementFilter(process.env.IIFE_ELEMENTS);
  const clearCache = process.env.IIFE_CLEAR_CACHE === '1';
  const instanceDir = join(process.cwd(), '.cache', 'iife-contract-tests');
  const outputDir = join(instanceDir, 'bundles');
  const cacheDir = join(instanceDir, 'cache');

  if (clearCache) {
    rmSync(instanceDir, { recursive: true, force: true });
  }
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  const bundler = new Bundler(outputDir, cacheDir);
  const matrix = loadReactElementMatrix(workspaceRoot).filter(
    (entry) => elementFilter.size === 0 || elementFilter.has(entry.name)
  );

  if (matrix.length === 0) {
    throw new Error('No React elements matched for IIFE contract test run.');
  }

  console.log(`[iife-contract] testing ${matrix.length} react element(s)`);

  const failures: ContractFailure[] = [];
  let cacheHits = 0;

  for (const entry of matrix) {
    const dependency = { name: entry.packageName, version: entry.version };
    const requestedBundles: BuildBundleName[] = entry.hasAuthor
      ? ['client-player', 'editor']
      : ['client-player'];
    const baseHash = mkDependencyHash([dependency]);
    const cacheSalt = createWorkspaceCacheSalt({
      workspaceRoot,
      dependencies: [dependency],
      packageDirs: [entry.packageDir],
      requestedBundles,
      resolutionMode: 'workspace-fast',
      sourceMaps: false,
      extraFiles: [join('packages', 'shared', 'bundler-shared', 'src', 'index.ts')],
    });

    console.log(
      `[iife-contract][${entry.name}] building bundles=${requestedBundles.join(',')} hash=${baseHash} salt=${cacheSalt.slice(0, 20)}`
    );

    const result = await bundler.build({
      dependencies: [dependency],
      options: {
        resolutionMode: 'workspace-fast',
        workspaceRoot,
        requestedBundles,
        sourceMaps: false,
        cacheSalt,
      },
    });

    if (!result.success) {
      failures.push({
        element: entry.name,
        bundle: 'client-player',
        reason: `build failed: ${result.errors?.join(' | ') || 'unknown error'}`,
      });
      continue;
    }

    const hash = result.hash;

    if (result.cached) {
      cacheHits += 1;
    }

    for (const bundle of requestedBundles) {
      const bundlePath = join(outputDir, hash, fileNameForBundle(bundle));
      if (!existsSync(bundlePath)) {
        failures.push({
          element: entry.name,
          bundle,
          reason: `bundle output missing: ${bundlePath}`,
        });
        continue;
      }

      const code = readFileSync(bundlePath, 'utf-8');
      const contractFailures = assertBundleContract(
        code,
        entry.packageName,
        bundle,
        entry.hasAuthor
      );
      for (const reason of contractFailures) {
        failures.push({ element: entry.name, bundle, reason });
      }
    }
  }

  console.log(
    `[iife-contract] completed elements=${matrix.length} failures=${failures.length} cacheHits=${cacheHits}`
  );

  if (failures.length > 0) {
    const report = failures
      .map((failure, index) => {
        return `${index + 1}. ${failure.element} [${failure.bundle}] ${failure.reason}`;
      })
      .join('\n');
    throw new Error(`IIFE bundle contract failures:\n${report}`);
  }
}

main().catch((error) => {
  console.error('[iife-contract] failed', error);
  process.exit(1);
});
