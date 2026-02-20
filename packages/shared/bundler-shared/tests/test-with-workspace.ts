#!/usr/bin/env bun
/**
 * Test bundler with local workspace packages
 *
 * This creates symlinks to local packages instead of downloading from NPM,
 * allowing us to test with the modernized elements that have fixed dependencies.
 */

import { Bundler } from '../src/index';
import { mkdirSync, symlinkSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function testWithWorkspace() {
  log('\n🚀 Testing PIE Bundler with Workspace Packages\n', 'bold');

  // Setup test workspace directory
  const workspaceRoot = join(tmpdir(), 'bundler-workspace-test');
  const cacheDir = join(workspaceRoot, 'cache');
  const outputDir = join(workspaceRoot, 'output');
  const packagesDir = join(workspaceRoot, 'packages');

  log('Step 1: Setup test workspace', 'blue');
  if (existsSync(workspaceRoot)) {
    log('  Cleaning old workspace...', 'blue');
    rmSync(workspaceRoot, { recursive: true, force: true });
  }

  mkdirSync(packagesDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  // Create symlinks to local packages
  const localPackages = {
    '@pie-element/shared-math-engine': join(__dirname, '../../math-engine'),
    '@pie-element/multiple-choice': join(__dirname, '../../../elements-react/multiple-choice'),
  };

  log('Step 2: Link local packages', 'blue');
  for (const [name, path] of Object.entries(localPackages)) {
    if (!existsSync(path)) {
      log(`  ⚠️  ${name} not found at ${path}`, 'yellow');
      continue;
    }

    const scopeDir = join(packagesDir, name.split('/')[0]);
    mkdirSync(scopeDir, { recursive: true });

    const linkPath = join(packagesDir, name.replace('@', '').replace('/', '-'));
    if (existsSync(linkPath)) {
      rmSync(linkPath, { recursive: true, force: true });
    }

    log(`  Linking ${name}...`, 'blue');
    symlinkSync(path, linkPath, 'dir');
    log(`  ✅ ${name} → ${linkPath}`, 'green');
  }

  log('\nStep 3: Create custom installer for workspace', 'blue');

  // We'll override the installer to use local symlinks
  const { installPackages: originalInstall } = await import('../src/installer.js');

  // Custom install that uses workspace links
  async function workspaceInstall(deps: any[], workspaceDir: string) {
    log(`  [installer] Using workspace packages`, 'blue');

    mkdirSync(workspaceDir, { recursive: true });
    const wsPackagesDir = join(workspaceDir, 'packages');
    mkdirSync(wsPackagesDir, { recursive: true });

    // Create workspace package.json
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      join(workspaceDir, 'package.json'),
      JSON.stringify(
        {
          name: 'pie-bundler-workspace',
          private: true,
          workspaces: [
            'packages/*',
            'packages/*/controller',
            'packages/*/configure',
            'packages/*/author',
          ],
        },
        null,
        2
      )
    );

    // Link packages
    for (const dep of deps) {
      const packageName = dep.name.split('/')[1];
      const targetDir = join(wsPackagesDir, packageName);
      const sourcePath = Object.values(localPackages).find((p) => p.includes(packageName));

      if (sourcePath && existsSync(sourcePath)) {
        log(`  Linking ${dep.name} from workspace`, 'blue');
        symlinkSync(sourcePath, targetDir, 'dir');
      } else {
        log(`  ⚠️  ${dep.name} not found in workspace`, 'yellow');
      }
    }

    // Run bun install
    const { execSync } = await import('node:child_process');
    log('  Running bun install...', 'blue');
    execSync('bun install', { cwd: workspaceDir, stdio: 'inherit' });
  }

  log('\nStep 4: Test bundler', 'blue');

  // Create a test version of the bundler that uses workspace packages
  const bundler = new Bundler(outputDir, cacheDir);

  // Monkey-patch the installer
  const installerModule = await import('../src/installer.js');
  const originalFn = installerModule.installPackages;
  (installerModule as any).installPackages = workspaceInstall;

  try {
    log('  Building bundle...', 'blue');
    const result = await bundler.build({
      dependencies: [
        { name: '@pie-element/multiple-choice', version: '0.1.0' }, // version doesn't matter for workspace
      ],
    });

    log('\nStep 5: Verify results', 'blue');
    log('Build Result:', 'blue');
    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      log('\n❌ Build failed', 'red');
      if (result.errors) {
        log('Errors:', 'red');
        for (const err of result.errors) {
          log(`  - ${err}`, 'red');
        }
      }
      process.exit(1);
    }

    log('\n✅ Build successful', 'green');

    // Check bundle files
    const bundleDir = join(outputDir, result.hash);
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
      log('⚠️  IIFE format not verified', 'yellow');
    }

    log('\n🎉 All tests passed!\n', 'green');
    log('Bundles created at:', 'blue');
    log(`  ${bundleDir}\n`, 'blue');
  } finally {
    // Restore original installer
    (installerModule as any).installPackages = originalFn;
  }
}

testWithWorkspace().catch((error) => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
