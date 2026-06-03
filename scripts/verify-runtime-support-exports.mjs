import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const packageRoots = [
  join(repoRoot, 'packages', 'elements-react'),
  join(repoRoot, 'packages', 'elements-svelte'),
];

const errors = [];

// Non-browser-ESM packages must publish runtime-support metadata that explicitly
// marks browser ESM unsupported. Browser-ESM packages may omit this export.

function getElementPackageDirs(rootDir) {
  if (!existsSync(rootDir)) return [];
  return readdirSync(rootDir)
    .map((name) => join(rootDir, name))
    .filter((dir) => statSync(dir).isDirectory() && existsSync(join(dir, 'package.json')));
}

function extractRuntimeSupportExportTargets(runtimeSupportExport) {
  if (!runtimeSupportExport) return [];
  if (typeof runtimeSupportExport === 'string') return [runtimeSupportExport];
  if (typeof runtimeSupportExport === 'object') {
    return Object.values(runtimeSupportExport).filter((value) => typeof value === 'string');
  }
  return [];
}

function extractRuntimeSupportDefaultTarget(runtimeSupportExport) {
  if (!runtimeSupportExport) return null;
  if (typeof runtimeSupportExport === 'string') return runtimeSupportExport;
  if (
    typeof runtimeSupportExport === 'object' &&
    typeof runtimeSupportExport.default === 'string'
  ) {
    return runtimeSupportExport.default;
  }
  return null;
}

function isCoveredByFiles(files, targetPath) {
  if (!Array.isArray(files) || files.length === 0) return false;
  const cleanTarget = String(targetPath).replace(/^\.\//, '');
  return files.some((entry) => {
    const cleanEntry = String(entry).replace(/^\.\//, '');
    return cleanTarget === cleanEntry || cleanTarget.startsWith(`${cleanEntry}/`);
  });
}

async function validateRuntimeSupportMetadata(packageName, targetPath, absoluteTarget) {
  if (!targetPath.endsWith('.js')) {
    return [`${packageName}: exports["./runtime-support"].default must point at a JavaScript file`];
  }

  try {
    const moduleUrl = `${pathToFileURL(absoluteTarget).href}?verify=${Date.now()}`;
    const runtimeSupportModule = await import(moduleUrl);
    const metadata = runtimeSupportModule.default ?? runtimeSupportModule.runtimeSupport;
    const metadataErrors = [];

    if (!metadata || typeof metadata !== 'object') {
      return [`${packageName}: runtime-support export must provide a metadata object`];
    }
    if (metadata.schemaVersion !== 1) {
      metadataErrors.push(`${packageName}: runtime-support schemaVersion must be 1`);
    }
    if (metadata.packageName && metadata.packageName !== packageName) {
      metadataErrors.push(
        `${packageName}: runtime-support packageName must match package.json name`
      );
    }

    const esmSupport = metadata.supports?.esm;
    if (!esmSupport || typeof esmSupport !== 'object') {
      metadataErrors.push(`${packageName}: runtime-support supports.esm metadata is missing`);
      return metadataErrors;
    }

    for (const view of ['delivery', 'author', 'print']) {
      if (esmSupport[view] !== false) {
        metadataErrors.push(
          `${packageName}: runtime-support supports.esm.${view} must be false for non-browser-ESM packages`
        );
      }
    }

    return metadataErrors;
  } catch (error) {
    return [
      `${packageName}: failed to import runtime-support metadata from ${targetPath}: ${
        error?.message ?? error
      }`,
    ];
  }
}

for (const rootDir of packageRoots) {
  const dirs = getElementPackageDirs(rootDir);
  for (const dir of dirs) {
    const packageJsonPath = join(dir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.private) {
      continue;
    }
    const runtimeSupportExport = packageJson.exports?.['./runtime-support'];
    const targetPaths = extractRuntimeSupportExportTargets(runtimeSupportExport);
    const browserExports = Object.keys(packageJson.exports ?? {}).filter((key) =>
      key.startsWith('./browser/')
    );

    const hasRuntimeSupportSource =
      existsSync(join(dir, 'src', 'runtime-support.ts')) ||
      existsSync(join(dir, 'src', 'runtime-support.js'));
    const hasRuntimeSupportArtifact = hasRuntimeSupportSource;

    if (hasRuntimeSupportArtifact && targetPaths.length === 0) {
      errors.push(
        `${packageJson.name}: runtime-support artifact exists but exports["./runtime-support"] is missing`
      );
      continue;
    }

    if (targetPaths.length > 0) {
      for (const targetPath of targetPaths) {
        const absoluteTarget = join(dir, targetPath.replace(/^\.\//, ''));
        if (!existsSync(absoluteTarget)) {
          errors.push(`${packageJson.name}: missing runtime-support target file ${targetPath}`);
          continue;
        }
        if (!isCoveredByFiles(packageJson.files, targetPath)) {
          errors.push(
            `${packageJson.name}: files[] does not cover runtime-support target ${targetPath}`
          );
        }
      }
    }

    if (browserExports.length === 0) {
      const defaultTarget = extractRuntimeSupportDefaultTarget(runtimeSupportExport);
      if (!defaultTarget) {
        errors.push(
          `${packageJson.name}: non-browser-ESM packages must expose exports["./runtime-support"].default`
        );
        continue;
      }

      const absoluteDefaultTarget = join(dir, defaultTarget.replace(/^\.\//, ''));
      if (existsSync(absoluteDefaultTarget)) {
        errors.push(
          ...(await validateRuntimeSupportMetadata(
            packageJson.name,
            defaultTarget,
            absoluteDefaultTarget
          ))
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Runtime support export verification failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Runtime support export verification passed.');
