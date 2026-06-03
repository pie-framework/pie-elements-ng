#!/usr/bin/env bun
/**
 * Test script for bundler with local packages via Verdaccio
 *
 * Prerequisites:
 * 1. Start Verdaccio: docker compose up -d verdaccio
 * 2. Build local packages: bun run build (in relevant package directories)
 * 3. Run this script: bun run tests/run-verdaccio-test.ts
 */

import { Bundler } from '../src/index';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERDACCIO_URL = 'http://localhost:4873';
const TEST_VERSION = `0.0.0-test.${Date.now()}`;
const TEST_PACKAGE = process.env.VERDACCIO_TEST_PACKAGE || '@pie-element/multiple-choice';
const PUBLISH_PACKAGES = (process.env.VERDACCIO_PACKAGES || TEST_PACKAGE)
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkVerdaccio(): boolean {
  try {
    execSync(`curl -sf ${VERDACCIO_URL}/-/ping`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function findWorkspaceRoot(startDir: string): string {
  let currentDir = startDir;

  while (true) {
    const packageJsonPath = join(currentDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const workspaces = packageJson.workspaces;
      if (Array.isArray(workspaces) || Array.isArray(workspaces?.packages)) {
        return currentDir;
      }
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Could not find workspace root from ${startDir}`);
    }
    currentDir = parentDir;
  }
}

function workspacePatterns(workspaceRoot: string): string[] {
  const packageJson = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf-8'));
  const workspaces = packageJson.workspaces;
  return Array.isArray(workspaces) ? workspaces : workspaces?.packages || [];
}

function resolveWorkspacePackage(workspaceRoot: string, packageName: string): string {
  for (const pattern of workspacePatterns(workspaceRoot)) {
    if (!pattern.endsWith('/*')) continue;

    const baseDir = join(workspaceRoot, pattern.slice(0, -2));
    if (!existsSync(baseDir)) continue;

    for (const entry of readdirSync(baseDir)) {
      const packageDir = join(baseDir, entry);
      const packageJsonPath = join(packageDir, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.name === packageName) {
        return packageDir;
      }
    }
  }

  throw new Error(`Package ${packageName} was not found in workspace packages.`);
}

async function publishPackage(packagePath: string): Promise<string | null> {
  const packageJsonPath = join(packagePath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    log(`⚠️  Package not found: ${packagePath}`, 'yellow');
    return null;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageName = packageJson.name;
  const originalVersion = packageJson.version;

  log(`📦 Publishing ${packageName}...`, 'blue');

  try {
    // Build the package
    log('  Building...', 'blue');
    execSync('bun run build', { cwd: packagePath, stdio: 'pipe' });

    // Update version
    log(`  Setting version to ${TEST_VERSION}...`, 'blue');
    execSync(`npm version ${TEST_VERSION} --no-git-tag-version --allow-same-version`, {
      cwd: packagePath,
      stdio: 'pipe',
    });

    // Publish to Verdaccio
    log('  Publishing to Verdaccio...', 'blue');
    execSync(`npm publish --registry ${VERDACCIO_URL}`, {
      cwd: packagePath,
      stdio: 'pipe',
    });

    // Restore original version
    execSync(`npm version ${originalVersion} --no-git-tag-version --allow-same-version`, {
      cwd: packagePath,
      stdio: 'pipe',
    });

    log(`  ✅ Published ${packageName}@${TEST_VERSION}`, 'green');
    return packageName;
  } catch (error: any) {
    log(`  ❌ Failed to publish ${packageName}: ${error.message}`, 'red');
    return null;
  }
}

async function testBundler() {
  log('\n🚀 Testing PIE Bundler with Verdaccio\n', 'bold');

  // Step 1: Check Verdaccio
  log('Step 1: Check Verdaccio', 'blue');
  if (!checkVerdaccio()) {
    log('❌ Verdaccio is not running', 'red');
    log('Start it with: docker compose up -d verdaccio', 'yellow');
    process.exit(1);
  }
  log('✅ Verdaccio is running\n', 'green');

  // Step 2: Publish packages
  log('Step 2: Publish local packages', 'blue');
  const workspaceRoot = findWorkspaceRoot(__dirname);
  const packagesToPublish = PUBLISH_PACKAGES.map((packageName) =>
    resolveWorkspacePackage(workspaceRoot, packageName)
  );

  const published: string[] = [];
  for (const pkgPath of packagesToPublish) {
    const packageName = await publishPackage(pkgPath);
    if (packageName) {
      published.push(packageName);
    }
  }

  if (published.length === 0) {
    log('\n❌ No packages were published', 'red');
    process.exit(1);
  }

  log(`\n✅ Published ${published.length} packages\n`, 'green');

  // Step 3: Test bundler
  log('Step 3: Test bundler with Verdaccio packages', 'blue');

  const bundler = new Bundler(
    join(tmpdir(), 'bundler-verdaccio-test-output'),
    join(tmpdir(), 'bundler-verdaccio-test-cache'),
    VERDACCIO_URL
  );

  if (!published.includes(TEST_PACKAGE)) {
    throw new Error(
      `${TEST_PACKAGE} must be included in VERDACCIO_PACKAGES so the bundler test can install the test version.`
    );
  }

  log(`Building bundle with ${TEST_PACKAGE}...`, 'blue');
  const result = await bundler.build({
    dependencies: [{ name: TEST_PACKAGE, version: TEST_VERSION }],
  });

  log('\nBuild Result:', 'blue');
  console.log(JSON.stringify(result, null, 2));

  // Step 4: Verify result
  log('\nStep 4: Verify result', 'blue');

  if (!result.success) {
    log('❌ Build failed', 'red');
    if (result.errors) {
      log('Errors:', 'red');
      for (const err of result.errors) {
        log(`  - ${err}`, 'red');
      }
    }
    process.exit(1);
  }

  log('✅ Build successful', 'green');

  // Check bundle files
  const bundleDir = join(tmpdir(), 'bundler-verdaccio-test-output', result.hash);
  const files = ['player.js', 'client-player.js', 'editor.js'];

  log('Checking bundle files...', 'blue');
  for (const file of files) {
    const filePath = join(bundleDir, file);
    if (existsSync(filePath)) {
      const size = readFileSync(filePath, 'utf-8').length;
      log(`  ✅ ${file} (${(size / 1024).toFixed(1)} KB)`, 'green');
    } else {
      log(`  ❌ ${file} not found`, 'red');
    }
  }

  // Verify IIFE format
  const playerContent = readFileSync(join(bundleDir, 'player.js'), 'utf-8');
  if (playerContent.includes('window.pie')) {
    log('✅ IIFE format verified (window.pie found)', 'green');
  } else {
    log('⚠️  IIFE format not verified (window.pie not found)', 'yellow');
  }

  log('\n🎉 All tests passed!\n', 'green');
  log('Bundles created at:', 'blue');
  log(`  ${bundleDir}`, 'blue');
}

testBundler().catch((error) => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
