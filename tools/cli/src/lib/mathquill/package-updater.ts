import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from '../../utils/logger.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Package Configuration Updater
 *
 * Updates package.json to use Desmos fork and adds migration metadata
 */

export async function updatePackageConfiguration(
  mathquillPath: string,
  logger: Logger
): Promise<void> {
  const pkgPath = join(mathquillPath, 'package.json');

  // Read current package.json
  const pkgContent = readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent);

  // Update dependencies
  logger.info('   Updating dependencies...');

  // Remove jQuery (no longer needed as direct dependency)
  if (pkg.dependencies?.jquery) {
    delete pkg.dependencies.jquery;
    logger.success('   ✓ Removed jQuery dependency');
  }

  // Add Desmos MathQuill fork
  if (!pkg.dependencies) {
    pkg.dependencies = {};
  }

  pkg.dependencies.mathquill = 'github:desmosinc/mathquill';
  logger.success('   ✓ Added Desmos MathQuill fork');

  // Update description
  pkg.description =
    'MathQuill for PIE - Desmos fork with Khan patches, Learnosity features, and PIE extensions';

  // Add migration metadata
  pkg.mathquillMigration = {
    version: '2.0',
    date: new Date().toISOString(),
    base: {
      fork: 'desmosinc/mathquill',
      repo: 'https://github.com/desmosinc/mathquill',
    },
    patches: {
      khan: ['mobile-keyboard', 'i18n-aria'],
      learnosity: ['recurring-decimal', 'not-symbols', 'empty-method'],
      pie: ['matrices', 'lrn-exponent'],
    },
    migratedFrom: {
      version: pkg.version,
      fork: 'pie-framework/mathquill',
      baseVersion: '0.10.1',
    },
  };

  // Write updated package.json
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  logger.success('   ✓ Updated package.json');

  // Install dependencies
  logger.info('   Installing dependencies...');
  try {
    await execAsync(`cd ${mathquillPath} && bun install`);
    logger.success('   ✓ Dependencies installed');
  } catch (error) {
    logger.warn('   ⚠️  Failed to install dependencies automatically');
    logger.info('   Run manually: cd packages/shared/mathquill && bun install');
  }
}

export function createMigrationConfig(mathquillPath: string, logger: Logger): void {
  const configPath = join(mathquillPath, 'migration-config.json');

  const config = {
    version: '2.0',
    migrationDate: new Date().toISOString(),
    base: {
      fork: 'desmosinc/mathquill',
      repo: 'https://github.com/desmosinc/mathquill.git',
      ref: 'main',
    },
    patches: {
      khan: {
        fork: 'Khan/mathquill',
        repo: 'https://github.com/Khan/mathquill.git',
        ref: 'v1.0.3',
        features: ['mobile-keyboard', 'i18n-aria'],
      },
      learnosity: {
        fork: 'Learnosity/mathquill',
        repo: 'https://github.com/Learnosity/mathquill.git',
        ref: 'master',
        features: ['recurring-decimal', 'not-symbols', 'empty-method'],
      },
    },
    extensions: {
      pie: {
        features: ['matrices', 'lrn-exponent'],
      },
    },
    migrationState: 'complete',
    tests: {
      unit: 'pending',
      integration: 'pending',
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  logger.success('   ✓ Created migration-config.json');
}
