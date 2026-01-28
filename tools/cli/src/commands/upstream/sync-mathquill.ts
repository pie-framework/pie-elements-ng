import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { syncMathQuill } from '../../lib/upstream/sync-mathquill.js';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export default class SyncMathQuill extends Command {
  static description = `Sync MathQuill fork from upstream

Syncs the PIE MathQuill fork sources from ../mathquill to packages/shared/mathquill
and regenerates the concatenated bundle.

This command:
1. Copies source files (JS, CSS, fonts) from upstream
2. Regenerates the legacy/mathquill-bundle.js from sources
3. Copies documentation files (README, CHANGELOG)

After running this command, you should:
1. Review changes in packages/shared/mathquill
2. Update version in package.json if needed
3. Run: bun run build (in mathquill package)
4. Test with consuming packages (math-input, math-inline)
`;

  static examples = [
    '$ pie upstream:sync-mathquill',
    '$ pie upstream:sync-mathquill --upstream-path /path/to/mathquill',
    '$ pie upstream:sync-mathquill --dry-run',
  ];

  static flags = {
    'upstream-path': Flags.string({
      description: 'Path to upstream mathquill repository',
      default: '../mathquill',
    }),
    'dry-run': Flags.boolean({
      description: 'Show what would be synced without making changes',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SyncMathQuill);
    const logger = new Logger(flags.verbose);

    // Resolve paths
    const workspaceRoot = process.cwd();
    const upstreamMathQuillPath = join(workspaceRoot, flags['upstream-path']);
    const sharedMathQuillPath = join(workspaceRoot, 'packages/shared/mathquill');

    // Validate paths
    if (!existsSync(upstreamMathQuillPath)) {
      logger.error(`❌ Upstream MathQuill not found at: ${upstreamMathQuillPath}`);
      logger.info(`   Specify the correct path with --upstream-path`);
      this.exit(1);
    }

    if (!existsSync(sharedMathQuillPath)) {
      logger.error(`❌ Shared MathQuill package not found at: ${sharedMathQuillPath}`);
      logger.info(`   Run this command from the workspace root`);
      this.exit(1);
    }

    logger.section('🔄 Syncing MathQuill from Upstream');
    logger.info(`   Upstream: ${upstreamMathQuillPath}`);
    logger.info(`   Target:   ${sharedMathQuillPath}\n`);

    if (flags['dry-run']) {
      logger.warn('🏃 DRY RUN MODE - No changes will be made\n');
      logger.info('Would sync:');
      logger.info('  • Core JavaScript files (intro.js, outro.js, tree.js, etc.)');
      logger.info('  • Service modules (services/)');
      logger.info('  • Command modules (commands/)');
      logger.info('  • CSS stylesheets (css/)');
      logger.info('  • Font files (fonts/)');
      logger.info('  • Documentation (README.md, CHANGELOG.md)');
      logger.info('\nWould regenerate:');
      logger.info('  • src/legacy/mathquill-bundle.js (concatenated IIFE bundle)');
      return;
    }

    // Perform sync
    const success = await syncMathQuill({
      upstreamMathQuillPath,
      sharedMathQuillPath,
      logger,
    });

    if (!success) {
      logger.error('\n❌ MathQuill sync failed');
      this.exit(1);
    }

    // Success message
    logger.section('✅ MathQuill Sync Complete');
    logger.info('\nNext steps:');
    logger.info('  1. Review changes: git diff packages/shared/mathquill');
    logger.info('  2. Update version: packages/shared/mathquill/package.json');
    logger.info('  3. Build package: cd packages/shared/mathquill && bun run build');
    logger.info('  4. Test packages: bun run build (in math-input, math-inline, math-templated)');
    logger.info('  5. Commit changes: git add packages/shared/mathquill && git commit');
  }
}
