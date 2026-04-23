import { Command, Flags } from '@oclif/core';
import { resolve } from 'node:path';
import AnalyzeEsm from './analyze-esm.js';
import Sync from './sync.js';
import { assertReposExist } from '../../lib/upstream/repo-utils.js';

export default class Update extends Command {
  static override description =
    'Update from upstream: analyze ESM compatibility and sync compatible packages';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dry-run',
    '<%= config.bin %> <%= command.id %> --element=multiple-choice',
    '<%= config.bin %> <%= command.id %> --verbose',
  ];

  static override flags = {
    'dry-run': Flags.boolean({
      description: 'Show what would be synced without making changes',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
    element: Flags.string({
      description: 'Update only specified element',
    }),
    'skip-build': Flags.boolean({
      description: 'Skip building after sync',
      default: false,
    }),
    'include-dev-deps': Flags.boolean({
      description: 'Include dev dependencies in ESM analysis',
      default: false,
    }),
    validate: Flags.boolean({
      description: 'Run runtime validation during ESM analysis',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Update);

    // Verify pie-elements and pie-lib repos exist
    const pieElementsPath = resolve(process.cwd(), '../pie-elements');
    const pieLibPath = resolve(process.cwd(), '../pie-lib');

    try {
      assertReposExist([
        {
          label: 'pie-elements repository',
          path: pieElementsPath,
          extraMessage: 'Expected upstream repository as a sibling directory.',
        },
        {
          label: 'pie-lib repository',
          path: pieLibPath,
          extraMessage: 'Expected upstream repository as a sibling directory.',
        },
      ]);
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }

    if (flags.verbose) {
      this.log('');
      this.log('╔═══════════════════════════════════════════════════════╗');
      this.log('║         Updating from Upstream Repositories          ║');
      this.log('╚═══════════════════════════════════════════════════════╝');
      this.log('');
      this.log('📊 Step 1/2: Analyzing ESM compatibility...');
      this.log('');
    }

    if (!flags['dry-run']) {
      const analyzeFlags = [
        '--output=.compatibility/report.json',
        flags.verbose ? '--verbose' : '',
        flags['include-dev-deps'] ? '--include-dev-deps' : '',
        flags.validate ? '--validate' : '',
      ].filter(Boolean);

      await AnalyzeEsm.run(analyzeFlags);
    } else if (flags.verbose) {
      this.log('ℹ️  Dry-run: skipping compatibility report write from analyze-esm');
      this.log('   Using existing .compatibility/report.json for filtering.\n');
    }

    if (flags.verbose) {
      this.log('');
      this.log('─'.repeat(60));
      this.log('');
      this.log('🔄 Step 2/2: Syncing compatible packages...');
      this.log('');
    }

    const syncFlags = [
      flags['dry-run'] ? '--dry-run' : '',
      flags.verbose ? '--verbose' : '',
      flags.element ? `--element=${flags.element}` : '',
      flags['skip-build'] ? '--skip-build' : '',
    ].filter(Boolean);

    await Sync.run(syncFlags);

    if (!flags.verbose) {
      this.log('');
      this.log('✅ Update complete!');
    }
  }
}
