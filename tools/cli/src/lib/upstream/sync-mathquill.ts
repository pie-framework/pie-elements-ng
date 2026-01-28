/**
 * MathQuill synchronization utilities
 *
 * Handles syncing the PIE MathQuill fork from ../mathquill to packages/shared/mathquill
 * and regenerating the concatenated bundle.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { join } from 'node:path';
import type { Logger } from '../../utils/logger.js';

export interface MathQuillSyncConfig {
  upstreamMathQuillPath: string;
  sharedMathQuillPath: string;
  logger: Logger;
}

/**
 * Sync MathQuill source files from upstream
 */
export async function syncMathQuillSources(config: MathQuillSyncConfig): Promise<boolean> {
  const { upstreamMathQuillPath, sharedMathQuillPath, logger } = config;

  if (!existsSync(upstreamMathQuillPath)) {
    logger.warn(
      `⚠️  Upstream MathQuill not found at ${upstreamMathQuillPath} - skipping MathQuill sync`
    );
    return false;
  }

  logger.info('📦 Syncing MathQuill sources from upstream...');

  try {
    // Ensure destination directories exist
    await mkdir(join(sharedMathQuillPath, 'src'), { recursive: true });

    // Copy core JavaScript files
    const coreFiles = [
      'intro.js',
      'outro.js',
      'tree.js',
      'cursor.js',
      'controller.js',
      'publicapi.js',
    ];
    for (const file of coreFiles) {
      const src = join(upstreamMathQuillPath, 'src', file);
      const dest = join(sharedMathQuillPath, 'src', file);
      if (existsSync(src)) {
        await cp(src, dest);
        logger.debug(`   Copied ${file}`);
      }
    }

    // Copy directories
    const directories = ['services', 'commands', 'css', 'fonts'];
    for (const dir of directories) {
      const src = join(upstreamMathQuillPath, 'src', dir);
      const dest = join(sharedMathQuillPath, 'src', dir);
      if (existsSync(src)) {
        await cp(src, dest, { recursive: true });
        logger.debug(`   Copied ${dir}/`);
      }
    }

    // Copy documentation
    const docs = ['README.md', 'CHANGELOG.md'];
    for (const doc of docs) {
      const src = join(upstreamMathQuillPath, doc);
      const dest = join(sharedMathQuillPath, doc);
      if (existsSync(src)) {
        await cp(src, dest);
        logger.debug(`   Copied ${doc}`);
      }
    }

    logger.success('✅ MathQuill sources synced');
    return true;
  } catch (error) {
    logger.error(`❌ Failed to sync MathQuill sources: ${error}`);
    return false;
  }
}

/**
 * Regenerate the MathQuill bundle from source files
 */
export async function regenerateMathQuillBundle(config: MathQuillSyncConfig): Promise<boolean> {
  const { upstreamMathQuillPath, sharedMathQuillPath, logger } = config;

  logger.info('🔨 Regenerating MathQuill bundle...');

  try {
    // Check for pjs library in upstream
    const pjsPath = join(upstreamMathQuillPath, 'node_modules/pjs/src/p.js');
    if (!existsSync(pjsPath)) {
      logger.warn(
        `⚠️  pjs library not found in upstream. Install it first: cd ${upstreamMathQuillPath} && npm install pjs`
      );
      return false;
    }

    // Read pjs
    const pjsContent = await readFile(pjsPath, 'utf-8');

    // Read all source files in order
    const srcDir = join(sharedMathQuillPath, 'src');
    const fileOrder = [
      'intro.js',
      // pjs is inserted here programmatically
      'tree.js',
      'cursor.js',
      'controller.js',
      'publicapi.js',
    ];

    // Concatenate main files
    let bundle = '';
    for (const file of fileOrder) {
      if (file === 'intro.js') {
        const content = await readFile(join(srcDir, file), 'utf-8');
        bundle += content + '\n';
        bundle += pjsContent + '\n'; // Insert pjs after intro
      } else {
        const content = await readFile(join(srcDir, file), 'utf-8');
        bundle += content + '\n';
      }
    }

    // Add service utilities (*.util.js files first)
    const servicesDir = join(srcDir, 'services');
    const serviceFiles = await readdir(servicesDir);
    const utilFiles = serviceFiles.filter((f: string) => f.endsWith('.util.js'));
    const otherServiceFiles = serviceFiles.filter(
      (f: string) => f.endsWith('.js') && !f.endsWith('.util.js')
    );

    for (const file of [...utilFiles, ...otherServiceFiles]) {
      const content = await readFile(join(servicesDir, file), 'utf-8');
      bundle += content + '\n';
    }

    // Add commands
    const commandsDir = join(srcDir, 'commands');
    bundle += (await readFile(join(commandsDir, 'math.js'), 'utf-8')) + '\n';
    bundle += (await readFile(join(commandsDir, 'text.js'), 'utf-8')) + '\n';

    // Add math commands
    const mathCommandsDir = join(commandsDir, 'math');
    const mathFiles = await readdir(mathCommandsDir);
    for (const file of mathFiles.filter((f: string) => f.endsWith('.js'))) {
      const content = await readFile(join(mathCommandsDir, file), 'utf-8');
      bundle += content + '\n';
    }

    // Add outro
    bundle += (await readFile(join(srcDir, 'outro.js'), 'utf-8')) + '\n';

    // Write bundle
    const legacyDir = join(srcDir, 'legacy');
    await mkdir(legacyDir, { recursive: true });
    const bundlePath = join(legacyDir, 'mathquill-bundle.js');
    await writeFile(bundlePath, bundle, 'utf-8');

    const lineCount = bundle.split('\n').length;
    logger.success(`✅ Bundle regenerated: ${lineCount} lines`);
    logger.info(`   Output: src/legacy/mathquill-bundle.js`);

    return true;
  } catch (error) {
    logger.error(`❌ Failed to regenerate bundle: ${error}`);
    return false;
  }
}

/**
 * Sync MathQuill: copy sources and regenerate bundle
 */
export async function syncMathQuill(config: MathQuillSyncConfig): Promise<boolean> {
  const sourcesSynced = await syncMathQuillSources(config);
  if (!sourcesSynced) {
    return false;
  }

  const bundleRegenerated = await regenerateMathQuillBundle(config);
  return bundleRegenerated;
}

// Helper to read directory (wraps fs/promises)
async function readdir(path: string): Promise<string[]> {
  const { readdir: fsReaddir } = await import('node:fs/promises');
  const entries = await fsReaddir(path, { withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name);
}
