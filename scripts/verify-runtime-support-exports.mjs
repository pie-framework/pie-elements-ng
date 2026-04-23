import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const packageRoots = [
  join(repoRoot, 'packages', 'elements-react'),
  join(repoRoot, 'packages', 'elements-svelte'),
];

const errors = [];

// Exception-only model:
// - If runtime-support export is omitted, the element is treated as fully supported by default.
// - If runtime-support export is declared, it must resolve to publishable files.

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

function isCoveredByFiles(files, targetPath) {
  if (!Array.isArray(files) || files.length === 0) return false;
  const cleanTarget = String(targetPath).replace(/^\.\//, '');
  return files.some((entry) => {
    const cleanEntry = String(entry).replace(/^\.\//, '');
    return cleanTarget === cleanEntry || cleanTarget.startsWith(`${cleanEntry}/`);
  });
}

for (const rootDir of packageRoots) {
  const dirs = getElementPackageDirs(rootDir);
  for (const dir of dirs) {
    const packageJsonPath = join(dir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const runtimeSupportExport = packageJson.exports?.['./runtime-support'];
    const targetPaths = extractRuntimeSupportExportTargets(runtimeSupportExport);

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
