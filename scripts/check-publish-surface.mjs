#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  collectJsFiles as collectPackageJsFiles,
  createPackageSnapshots,
  readJson,
  toPosix,
} from './lib/package-inspection.mjs';

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'scripts', 'publish-policy.json');
const BROWSER_ESM_POLICY_PATH = path.join(ROOT, 'tools', 'vite', 'browser-esm-policy.json');
const MAX_DETAILS_PER_PACKAGE = 20;
const FORBIDDEN_EXPORT_CONDITIONS = new Set(['development', 'svelte']);

const policy = existsSync(POLICY_PATH) ? readJson(POLICY_PATH) : {};
const browserEsmPolicy = readJson(BROWSER_ESM_POLICY_PATH);
const forbiddenPublicExports = new Map(Object.entries(policy.forbiddenPublicExports || {}));
const allowedBrowserBareImports = new Set(browserEsmPolicy.allowedBareImports || []);
const expectedBrowserSharedDependencies = browserEsmPolicy.sharedDependencyVersions || {};
const maxBrowserJsBytesPerPackage = Number(browserEsmPolicy.maxBrowserJsBytesPerPackage || 0);

const normalizeTarget = (value) => {
  if (typeof value !== 'string' || !value.startsWith('./')) return null;
  return value.slice(2);
};

const collectTargets = (value, out) => {
  const normalized = normalizeTarget(value);
  if (normalized) {
    out.add(normalized);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectTargets(entry, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectTargets(entry, out);
  }
};

const collectExportKeyViolations = (pkg, violations) => {
  const exportKeys = new Set();
  const walk = (value, keys = []) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const nextKeys = [...keys, key];
      if (keys.length === 0 && key.startsWith('.')) {
        exportKeys.add(key);
      }
      if (FORBIDDEN_EXPORT_CONDITIONS.has(key)) {
        violations.push(`export condition "${key}" is not allowed`);
      }
      walk(child, nextKeys);
    }
  };

  walk(pkg.exports);

  const forbiddenForPackage = forbiddenPublicExports.get(pkg.name) || [];
  for (const exportKey of forbiddenForPackage) {
    const matches = exportKey.endsWith('*')
      ? [...exportKeys].some((key) => key.startsWith(exportKey.slice(0, -1)))
      : exportKeys.has(exportKey);
    if (matches) {
      violations.push(`forbidden public export is present: ${exportKey}`);
    }
  }
};

const isMetadataFile = (filePath) =>
  /^(?:package\.json|README(?:\.[a-z]+)?|LICENSE(?:\.[a-z]+)?|CHANGELOG(?:\.[a-z]+)?)$/i.test(
    filePath
  );

const isRawSourceFile = (filePath) =>
  filePath.startsWith('src/') ||
  /\.svelte(?:\.ts)?$/.test(filePath) ||
  (/\.tsx?$/.test(filePath) && !filePath.endsWith('.d.ts'));

const normalizeManifestPath = (value) =>
  typeof value === 'string' ? value.replace(/^\.\//, '') : '';

const getDeclaredBinFiles = (pkg) => {
  if (typeof pkg.bin === 'string') return new Set([normalizeManifestPath(pkg.bin)]);
  if (!pkg.bin || typeof pkg.bin !== 'object') return new Set();
  return new Set(Object.values(pkg.bin).map(normalizeManifestPath).filter(Boolean));
};

const isAllowedPackedFile = (filePath, pkg) => {
  if (filePath.startsWith('dist/')) return true;
  if (filePath === 'controller.js' && pkg.pie?.controller?.endsWith('/controller')) {
    return true;
  }
  if (filePath === 'configure.js' && pkg.pie?.configure?.endsWith('/configure')) {
    return true;
  }
  if (getDeclaredBinFiles(pkg).has(filePath)) return true;
  if (isMetadataFile(filePath)) return true;
  if (filePath === 'oclif.manifest.json' && pkg.oclif) return true;
  if (/\.(?:css|json|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf|eot)$/.test(filePath)) {
    return true;
  }
  return false;
};

const collectControllerContractViolations = (dir, pkg) => {
  const violations = [];
  const controllerExport = pkg.exports?.['./controller'];
  const configureExport = pkg.exports?.['./configure'];
  const files = Array.isArray(pkg.files) ? pkg.files : [];
  const hasControllerContract =
    Boolean(controllerExport) ||
    Boolean(pkg.exports?.['./controller.js']) ||
    Boolean(pkg.pie?.controller) ||
    files.includes('controller.js');
  const hasConfigureContract =
    Boolean(configureExport) || Boolean(pkg.pie?.configure) || files.includes('configure.js');

  if (!hasControllerContract && !hasConfigureContract) {
    return violations;
  }

  const expectedControllerSpecifier = `${pkg.name}/controller`;
  const expectedConfigureSpecifier = `${pkg.name}/configure`;
  const controllerJsExport = pkg.exports?.['./controller.js'];

  if (hasControllerContract) {
    if (!controllerExport) {
      violations.push('exports["./controller"] is required for controller packages');
    }
    if (pkg.pie?.controller !== expectedControllerSpecifier) {
      violations.push(`pie.controller must be "${expectedControllerSpecifier}"`);
    }
    if (!controllerJsExport) {
      violations.push('exports["./controller.js"] is required for controller packages');
    } else if (controllerExport) {
      if (controllerJsExport.default !== controllerExport.default) {
        violations.push(
          'exports["./controller.js"].default must match exports["./controller"].default'
        );
      }
      if (controllerJsExport.types !== controllerExport.types) {
        violations.push(
          'exports["./controller.js"].types must match exports["./controller"].types'
        );
      }
    }
    if (!files.includes('controller.js')) {
      violations.push('files[] must include controller.js for controller packages');
    }
  }

  if (hasConfigureContract) {
    if (!configureExport) {
      violations.push('exports["./configure"] is required for author/configure packages');
    }
    if (pkg.pie?.configure !== expectedConfigureSpecifier) {
      violations.push(`pie.configure must be "${expectedConfigureSpecifier}"`);
    }
    if (!files.includes('configure.js')) {
      violations.push('files[] must include configure.js for author/configure packages');
    }

    const configureTarget = configureExport?.default;
    if (typeof configureTarget !== 'string' || !configureTarget.startsWith('./dist/')) {
      violations.push('exports["./configure"].default must point at ./dist/...');
    } else {
      const configureShimPath = path.join(dir, 'configure.js');
      const expectedConfigureShim = `export { default } from '${configureTarget}';\nexport * from '${configureTarget}';\n`;
      if (!existsSync(configureShimPath)) {
        violations.push('root configure.js compatibility shim is missing');
      } else {
        const configureShim = readFileSync(configureShimPath, 'utf8');
        if (configureShim !== expectedConfigureShim) {
          violations.push(`root configure.js shim must re-export ${configureTarget}`);
        }
      }
    }
  }

  if (hasControllerContract) {
    const shimPath = path.join(dir, 'controller.js');
    if (!existsSync(shimPath)) {
      violations.push('root controller.js compatibility shim is missing');
    } else {
      const shim = readFileSync(shimPath, 'utf8');
      if (shim !== "export * from './dist/controller/index.js';\n") {
        violations.push('root controller.js shim must re-export ./dist/controller/index.js');
      }
    }
  }

  return violations;
};

const collectBareImportSpecifiers = (source) => {
  const specifiers = [];
  for (const line of source.split(/\r?\n/)) {
    const match =
      line.match(/^\s*import\s+['"]([^'"]+)['"]/) ||
      line.match(/^\s*import\s+[^'"]+?\s+from\s+['"]([^'"]+)['"]/) ||
      line.match(/^\s*export\s+[^'"]+?\s+from\s+['"]([^'"]+)['"]/);
    if (!match) continue;
    const specifier = match[1];
    if (
      specifier.startsWith('.') ||
      specifier.startsWith('/') ||
      specifier.startsWith('http://') ||
      specifier.startsWith('https://')
    ) {
      continue;
    }
    specifiers.push(specifier);
  }
  return specifiers;
};

const collectBrowserEsmViolations = (dir, pkg) => {
  const browserExports = Object.entries(pkg.exports ?? {}).filter(([key]) =>
    key.startsWith('./browser/')
  );
  if (browserExports.length === 0) {
    return [];
  }

  const violations = [];
  const browserSharedDependencies = pkg.pie?.browserSharedDependencies;
  for (const [dependencyName, expectedVersion] of Object.entries(
    expectedBrowserSharedDependencies
  )) {
    const actualVersion = browserSharedDependencies?.[dependencyName];
    if (actualVersion !== expectedVersion) {
      violations.push(
        `pie.browserSharedDependencies.${dependencyName} must be "${expectedVersion}" for browser ESM packages`
      );
    }
  }

  for (const [key, value] of browserExports) {
    const target = typeof value === 'string' ? value : value?.default;
    if (typeof target !== 'string' || !target.startsWith('./dist/browser/')) {
      violations.push(`${key} must point at ./dist/browser/...`);
      continue;
    }

    const targetPath = path.join(dir, target.slice(2));
    if (!existsSync(targetPath)) {
      violations.push(`${key} target is missing: ${target}`);
    }
  }

  const browserDir = path.join(dir, 'dist/browser');
  let browserJsBytes = 0;
  const jsFiles = collectPackageJsFiles(browserDir);
  for (const filePath of jsFiles) {
    browserJsBytes += readFileSync(filePath).byteLength;
    const source = readFileSync(filePath, 'utf8');
    for (const specifier of collectBareImportSpecifiers(source)) {
      if (!allowedBrowserBareImports.has(specifier)) {
        const relPath = toPosix(path.relative(dir, filePath));
        violations.push(`${relPath} contains unsupported bare browser import "${specifier}"`);
      }
    }
    if (source.includes('customElements.define')) {
      const relPath = toPosix(path.relative(dir, filePath));
      violations.push(`${relPath} must not auto-register a custom element`);
    }
  }
  if (maxBrowserJsBytesPerPackage > 0 && browserJsBytes > maxBrowserJsBytesPerPackage) {
    violations.push(
      `dist/browser JS size ${browserJsBytes} bytes exceeds policy budget ${maxBrowserJsBytesPerPackage} bytes`
    );
  }

  return violations;
};

export const collectManifestViolations = (dir, pkg) => {
  const violations = [];
  if (Array.isArray(pkg.files)) {
    for (const entry of pkg.files) {
      const normalized = String(entry).replace(/^\.\//, '');
      if (normalized === 'src' || normalized.startsWith('src/')) {
        violations.push(`files[] includes source path: ${entry}`);
      }
      if (/\.svelte(?:\.ts)?$/.test(normalized)) {
        violations.push(`files[] includes raw Svelte source: ${entry}`);
      }
      if (/\.tsx?$/.test(normalized) && !normalized.endsWith('.d.ts')) {
        violations.push(`files[] includes raw TypeScript source: ${entry}`);
      }
    }
  }

  if (pkg.svelte) {
    violations.push('package-level svelte field is not allowed');
  }
  for (const dependencyBucket of ['optionalDependencies', 'peerDependencies']) {
    if (pkg[dependencyBucket]?.svelte) {
      violations.push(`${dependencyBucket}.svelte is not allowed`);
    }
  }
  if (pkg.peerDependenciesMeta?.svelte) {
    violations.push('peerDependenciesMeta.svelte is not allowed');
  }

  collectExportKeyViolations(pkg, violations);
  violations.push(...collectControllerContractViolations(dir, pkg));
  violations.push(...collectBrowserEsmViolations(dir, pkg));

  const targets = new Set();
  for (const field of ['main', 'module', 'types', 'unpkg', 'jsdelivr']) {
    collectTargets(pkg[field], targets);
  }
  collectTargets(pkg.exports, targets);

  for (const target of [...targets].sort()) {
    if (target.startsWith('src/')) {
      violations.push(`export target points at src: ./${target}`);
      continue;
    }
    if (/\.svelte(?:\.ts)?$/.test(target)) {
      violations.push(`export target exposes raw Svelte source: ./${target}`);
      continue;
    }
    if (/\.tsx?$/.test(target) && !target.endsWith('.d.ts')) {
      violations.push(`export target exposes raw TypeScript source: ./${target}`);
      continue;
    }
    if (!target.startsWith('dist/') && !isMetadataFile(target)) {
      violations.push(`export target is outside dist: ./${target}`);
    }
  }

  return violations;
};

export const collectPackViolations = (snapshot) => {
  const { packedFiles, pkg, packError } = snapshot;
  if (packedFiles == null && pkg == null) {
    throw new Error('invalid package snapshot');
  }
  if (packError) {
    throw packError;
  }
  if (!packedFiles) {
    throw new Error(
      'package snapshot is missing packedFiles; create snapshots with includePackedFiles'
    );
  }
  return [...packedFiles]
    .filter((filePath) => isRawSourceFile(filePath) || !isAllowedPackedFile(filePath, pkg))
    .map((filePath) => `packed file is outside dist/metadata/assets: ${filePath}`)
    .sort();
};

export const collectPublishSurfaceViolations = (snapshot) => {
  const violations = collectManifestViolations(snapshot.dir, snapshot.pkg);
  try {
    violations.push(...collectPackViolations(snapshot));
  } catch (error) {
    violations.push(
      error.stderr?.toString()?.trim() || error.message || 'failed to inspect npm pack contents'
    );
  }
  return violations;
};

export const collectPublishSurfaceFailures = ({
  root = ROOT,
  snapshots = createPackageSnapshots({ root, includePackedFiles: true }),
} = {}) => {
  const failures = [];
  for (const snapshot of snapshots) {
    const violations = collectPublishSurfaceViolations(snapshot);
    if (violations.length > 0) {
      failures.push({
        name: snapshot.pkg.name || path.basename(snapshot.dir),
        dir: snapshot.relativeDir ?? toPosix(path.relative(root, snapshot.dir)),
        violations,
      });
    }
  }
  return failures;
};

export const printPublishSurfaceResult = (
  { failures, checked },
  { log = console.log, error = console.error } = {}
) => {
  if (failures.length === 0) {
    log(`[check-publish-surface] OK: validated ${checked} publishable package(s)`);
    return;
  }
  error(
    `[check-publish-surface] Found ${failures.length} package(s) with non-dist publish surface`
  );
  for (const failure of failures) {
    error(`\n- ${failure.name} (${failure.dir})`);
    for (const violation of failure.violations.slice(0, MAX_DETAILS_PER_PACKAGE)) {
      error(`  - ${violation}`);
    }
    const omitted = failure.violations.length - MAX_DETAILS_PER_PACKAGE;
    if (omitted > 0) error(`  - ... ${omitted} more`);
  }
};

export const runPublishSurfaceCheck = (options = {}) => {
  const snapshots =
    options.snapshots ??
    createPackageSnapshots({
      root: options.root ?? ROOT,
      includePackedFiles: true,
      packRunner: options.packRunner,
    });
  const failures = collectPublishSurfaceFailures({ root: options.root ?? ROOT, snapshots });
  const result = { ok: failures.length === 0, checked: snapshots.length, failures };
  printPublishSurfaceResult(result, options);
  return result;
};

const isDirectRun = () =>
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun()) {
  const result = runPublishSurfaceCheck();
  if (!result.ok) process.exit(1);
}
