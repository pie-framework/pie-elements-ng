import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { MigrationOrchestrator } from '../../lib/mathquill/migration-orchestrator.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export default class MathQuillMigrate extends Command {
  static override description = `Migrate MathQuill from PIE fork to Desmos fork with patches

Automates the migration from PIE's 2015 MathQuill fork to the modern Desmos fork
with Khan Academy patches, Learnosity features, and PIE extensions.

This command:
1. Clones Desmos, Khan, and Learnosity forks to temp directory
2. Extracts features from each fork:
   - Khan: Mobile keyboard fixes, i18n ARIA strings
   - Learnosity: Recurring decimals, nless/ngtr symbols, empty() method
   - PIE: Matrices (pmatrix, bmatrix, vmatrix), lrnexponent
3. Generates TypeScript extension modules with source attribution
4. Creates unified extension loader
5. Updates package.json to use Desmos fork
6. Runs automated tests

The migration is repeatable - you can re-run it when forks update.

After migration, review changes and test thoroughly before committing.
`;

  static override examples = [
    {
      description: 'Show what would be migrated (dry run)',
      command: '<%= config.bin %> <%= command.id %> --dry-run',
    },
    {
      description: 'Run full migration',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Verbose output with detailed progress',
      command: '<%= config.bin %> <%= command.id %> --verbose',
    },
    {
      description: 'Force migration (skip confirmations)',
      command: '<%= config.bin %> <%= command.id %> --force',
    },
    {
      description: 'Skip tests',
      command: '<%= config.bin %> <%= command.id %> --skip-tests',
    },
  ];

  static override flags = {
    'dry-run': Flags.boolean({
      description: 'Show what would be done without making changes',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Skip confirmation prompts and continue on non-fatal errors',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed progress output',
      default: false,
    }),
    'skip-tests': Flags.boolean({
      description: 'Skip running tests after migration',
      default: false,
    }),
    'temp-dir': Flags.string({
      description: 'Temporary directory for cloning forks',
      default: '/tmp/mathquill-migration',
    }),
    clean: Flags.boolean({
      description: 'Clean temporary directory before starting',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MathQuillMigrate);
    const logger = new Logger(flags.verbose);

    // Validate workspace
    const workspaceRoot = process.cwd();
    const mathquillPath = join(workspaceRoot, 'packages/shared/mathquill');

    if (!existsSync(mathquillPath)) {
      logger.error('MathQuill package not found at: packages/shared/mathquill');
      logger.info('This command must be run from the workspace root');
      this.exit(1);
    }

    // Show banner
    logger.section('🚀 MathQuill Migration');
    logger.info('   Migrating from PIE fork to Desmos fork + patches\n');

    if (flags['dry-run']) {
      logger.warn('🏃 DRY RUN MODE - No changes will be made\n');
    }

    // Create orchestrator
    const orchestrator = new MigrationOrchestrator({
      workspaceRoot,
      mathquillPath,
      tempDir: flags['temp-dir'],
      dryRun: flags['dry-run'],
      force: flags.force,
      skipTests: flags['skip-tests'],
      clean: flags.clean,
      logger,
    });

    // Show configuration
    if (flags.verbose) {
      logger.section('Configuration');
      logger.info(`   Workspace:   ${workspaceRoot}`);
      logger.info(`   MathQuill:   ${mathquillPath}`);
      logger.info(`   Temp Dir:    ${flags['temp-dir']}`);
      logger.info(`   Dry Run:     ${flags['dry-run']}`);
      logger.info(`   Force:       ${flags.force}`);
      logger.info(`   Skip Tests:  ${flags['skip-tests']}\n`);
    }

    // Confirm if not in dry-run or force mode
    if (!flags['dry-run'] && !flags.force) {
      logger.warn('⚠️  This will modify packages/shared/mathquill');
      logger.info('   A git commit is recommended before proceeding.\n');

      // In a real implementation, you'd use inquirer or similar
      // For now, we'll just proceed
      logger.info('   Proceeding with migration...\n');
    }

    try {
      // Run migration
      const result = await orchestrator.migrate();

      if (flags['dry-run']) {
        this.showDryRunSummary(result, logger);
      } else {
        this.showSuccessSummary(result, logger);
      }

      if (!result.success) {
        this.exit(1);
      }
    } catch (error) {
      logger.error('\n❌ Migration failed');

      if (error instanceof Error) {
        logger.error(`   ${error.message}`);
        if (flags.verbose && error.stack) {
          logger.debug(`\n${error.stack}`);
        }
      }

      logger.info('\n💡 Troubleshooting:');
      logger.info('   1. Check internet connectivity for git clones');
      logger.info('   2. Ensure temp directory is writable');
      logger.info('   3. Run with --verbose for detailed output');
      logger.info('   4. Try --clean to remove cached forks');
      logger.info('   5. Check docs/MATHQUILL_MIGRATION_CLI_PLAN.md');

      this.exit(1);
    }
  }

  private showDryRunSummary(result: any, logger: Logger): void {
    logger.section('📋 Dry Run Summary');
    logger.info('Would perform the following actions:\n');

    logger.info('📂 Prepare environment:');
    logger.info(`   • Create temp directory: ${result.tempDir}`);
    logger.info('   • Create extension directories\n');

    logger.info('🔄 Clone forks:');
    logger.info('   • Desmos fork (desmosinc/mathquill)');
    logger.info('   • Khan fork (Khan/mathquill v1.0.3)');
    logger.info('   • Learnosity fork (Learnosity/mathquill)\n');

    logger.info('📦 Extract features:');
    logger.info('   Khan Academy:');
    logger.info('     • mobile-keyboard.ts (Android keyboard fixes)');
    logger.info('     • i18n-aria.ts (Internationalized ARIA strings)');
    logger.info('   Learnosity:');
    logger.info('     • recurring-decimal.ts (Recurring decimal dot)');
    logger.info('     • not-symbols.ts (nless, ngtr symbols)');
    logger.info('     • empty-method.ts (Check if field is empty)');
    logger.info('   PIE:');
    logger.info('     • matrices.ts (pmatrix, bmatrix, vmatrix)');
    logger.info('     • lrn-exponent.ts (LRN exponent notation)\n');

    logger.info('🔨 Generate:');
    logger.info('   • Extension loader (src/extensions/index.ts)\n');

    logger.info('📝 Update:');
    logger.info('   • Install: mathquill@github:desmosinc/mathquill');
    logger.info('   • Update: package.json with migration metadata\n');

    logger.info('🧪 Test:');
    logger.info('   • Run unit tests');
    logger.info('   • Run integration tests\n');

    logger.success('Dry run complete!');
    logger.info('\nRun without --dry-run to execute migration.');
  }

  private showSuccessSummary(result: any, logger: Logger): void {
    logger.section('✅ Migration Complete!');

    logger.info('\n📊 Summary:');
    logger.info(`   Base:         Desmos fork (${result.desmos?.commit || 'latest'})`);
    logger.info(`   + Khan:       ${result.khan?.featuresCount || 0} patches applied`);
    logger.info(`   + Learnosity: ${result.learnosity?.featuresCount || 0} features added`);
    logger.info(`   + PIE:        ${result.pie?.featuresCount || 0} extensions ported`);

    if (result.files && result.files.length > 0) {
      logger.info('\n📂 Generated Files:');
      logger.info('   packages/shared/mathquill/src/extensions/');
      logger.info('   ├── khan/');
      logger.info('   │   ├── mobile-keyboard.ts');
      logger.info('   │   └── i18n-aria.ts');
      logger.info('   ├── learnosity/');
      logger.info('   │   ├── recurring-decimal.ts');
      logger.info('   │   ├── not-symbols.ts');
      logger.info('   │   └── empty-method.ts');
      logger.info('   ├── pie/');
      logger.info('   │   ├── matrices.ts');
      logger.info('   │   └── lrn-exponent.ts');
      logger.info('   └── index.ts (loader)');
    }

    if (result.tests) {
      logger.info('\n🧪 Tests:');
      if (result.tests.unit?.passed) {
        logger.success(`   Unit tests: ${result.tests.unit.passed} passed`);
      }
      if (result.tests.integration?.passed) {
        logger.success(`   Integration tests: ${result.tests.integration.passed} passed`);
      }
      if (result.tests.warnings && result.tests.warnings.length > 0) {
        logger.warn(`   Warnings: ${result.tests.warnings.length}`);
      }
    }

    logger.info('\n📝 Next Steps:');
    logger.info('   1. Review changes:');
    logger.info('      git diff packages/shared/mathquill');
    logger.info('   2. Build package:');
    logger.info('      cd packages/shared/mathquill && bun run build');
    logger.info('   3. Test in demo:');
    logger.info('      bun run dev:demo');
    logger.info('   4. Verify migration:');
    logger.info('      pie mathquill:status');
    logger.info('   5. Run full test suite:');
    logger.info('      bun test packages/lib-react/math-input');
    logger.info('      bun test packages/elements-react/math-inline');
    logger.info('   6. Commit changes:');
    logger.info('      git add packages/shared/mathquill');
    logger.info('      git commit -m "Migrate MathQuill to Desmos fork + patches"');

    logger.info('\n💡 Tips:');
    logger.info('   • Review docs/MATHQUILL_MIGRATION_PLAN.md for details');
    logger.info('   • Check docs/MATHQUILL_FORK_ANALYSIS.md for fork comparison');
    logger.info('   • Run "pie mathquill:status" to verify migration state');
    logger.info('   • Keep /tmp/mathquill-migration for re-running migration\n');
  }
}
