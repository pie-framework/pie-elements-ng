import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export default class MathQuillStatus extends Command {
  static override description = `Show MathQuill migration status

Displays the current state of the MathQuill migration:
- Current version and source
- Migration state (pending, in-progress, complete)
- Installed fork versions (Desmos, Khan patches, Learnosity features)
- Extracted features and extensions
- Test results
- Next steps

Use this to verify migration success or check what needs to be done.
`;

  static override examples = [
    {
      description: 'Show migration status',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Verbose output with file details',
      command: '<%= config.bin %> <%= command.id %> --verbose',
    },
  ];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed information',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MathQuillStatus);
    const logger = new Logger(flags.verbose);

    const workspaceRoot = process.cwd();
    const mathquillPath = join(workspaceRoot, 'packages/shared/mathquill');

    if (!existsSync(mathquillPath)) {
      logger.error('MathQuill package not found at: packages/shared/mathquill');
      this.exit(1);
    }

    logger.section('📊 MathQuill Status');

    // Read package.json
    const pkgPath = join(mathquillPath, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    // Determine migration state
    const isLegacy = existsSync(join(mathquillPath, 'src/legacy/mathquill-bundle.js'));
    const hasExtensions = existsSync(join(mathquillPath, 'src/extensions'));
    const hasLoader = existsSync(join(mathquillPath, 'src/extensions/index.ts'));
    const migrationConfig = this.loadMigrationConfig(mathquillPath);

    // Current state
    this.log('\n📦 Current Configuration:');
    this.log(`   Package: ${pkg.name}@${pkg.version}`);
    this.log(`   Source:  ${this.detectSource(pkg, isLegacy, hasExtensions)}`);

    if (pkg.dependencies?.mathquill) {
      const dep = pkg.dependencies.mathquill;
      if (dep.includes('desmosinc')) {
        this.log(`   Fork:    Desmos (${dep})`);
      } else if (dep.includes('Khan')) {
        this.log(`   Fork:    Khan Academy (${dep})`);
      } else if (dep.includes('Learnosity')) {
        this.log(`   Fork:    Learnosity (${dep})`);
      } else {
        this.log(`   Fork:    ${dep}`);
      }
    }

    // Migration state
    this.log('\n🔄 Migration State:');
    const migrationState = this.determineMigrationState(
      isLegacy,
      hasExtensions,
      hasLoader,
      migrationConfig
    );
    this.log(`   Status:  ${migrationState.status} ${migrationState.icon}`);
    if (migrationState.detail) {
      this.log(`   Detail:  ${migrationState.detail}`);
    }

    // Extension state
    if (hasExtensions) {
      this.log('\n🔧 Extensions:');
      this.showExtensionStatus(mathquillPath, flags.verbose, logger);
    }

    // Migration metadata
    if (migrationConfig) {
      this.log('\n📋 Migration Metadata:');
      this.showMigrationMetadata(migrationConfig);
    }

    // Next steps
    this.log('\n📝 Next Steps:');
    this.showNextSteps(migrationState.status, isLegacy, hasExtensions);

    this.log('');
  }

  private detectSource(_pkg: any, isLegacy: boolean, hasExtensions: boolean): string {
    if (hasExtensions && !isLegacy) {
      return 'Desmos fork + patches (migrated)';
    }
    if (isLegacy) {
      return 'PIE fork (legacy - needs migration)';
    }
    return 'Unknown';
  }

  private determineMigrationState(
    isLegacy: boolean,
    hasExtensions: boolean,
    hasLoader: boolean,
    _config: any
  ): { status: string; icon: string; detail?: string } {
    if (!isLegacy && hasExtensions && hasLoader) {
      return {
        status: 'Complete',
        icon: '✅',
        detail: 'Migration successful',
      };
    }

    if (hasExtensions && !hasLoader) {
      return {
        status: 'In Progress',
        icon: '⚠️',
        detail: 'Extensions exist but loader missing',
      };
    }

    if (isLegacy && !hasExtensions) {
      return {
        status: 'Pending',
        icon: '📋',
        detail: 'Legacy fork still in use',
      };
    }

    if (isLegacy && hasExtensions) {
      return {
        status: 'Transitioning',
        icon: '🔄',
        detail: 'Both legacy and new extensions present',
      };
    }

    return {
      status: 'Unknown',
      icon: '❓',
      detail: 'Unexpected state',
    };
  }

  private showExtensionStatus(mathquillPath: string, verbose: boolean, _logger: Logger): void {
    const extensionDirs = [
      { name: 'Khan', path: 'src/extensions/khan' },
      { name: 'Learnosity', path: 'src/extensions/learnosity' },
      { name: 'PIE', path: 'src/extensions/pie' },
    ];

    for (const ext of extensionDirs) {
      const fullPath = join(mathquillPath, ext.path);
      if (existsSync(fullPath)) {
        const files = this.countTypeScriptFiles(fullPath);
        this.log(`   ${ext.name}: ${files} file(s) ✓`);

        if (verbose) {
          const indexExists = existsSync(join(fullPath, 'index.ts'));
          this.log(`     • index.ts: ${indexExists ? '✓' : '✗'}`);
        }
      } else {
        this.log(`   ${ext.name}: Not found ✗`);
      }
    }

    const loaderPath = join(mathquillPath, 'src/extensions/index.ts');
    if (existsSync(loaderPath)) {
      this.log(`   Loader:  ✓`);
    } else {
      this.log(`   Loader:  ✗ (Missing extension loader)`);
    }
  }

  private countTypeScriptFiles(dir: string): number {
    if (!existsSync(dir)) return 0;

    try {
      const { readdirSync } = require('node:fs');
      const files = readdirSync(dir);
      return files.filter((f: string) => f.endsWith('.ts') || f.endsWith('.tsx')).length;
    } catch {
      return 0;
    }
  }

  private loadMigrationConfig(mathquillPath: string): any {
    const configPath = join(mathquillPath, 'migration-config.json');
    if (!existsSync(configPath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  private showMigrationMetadata(config: any): void {
    if (config.version) {
      this.log(`   Version:      ${config.version}`);
    }
    if (config.lastMigration) {
      this.log(`   Last run:     ${new Date(config.lastMigration).toLocaleString()}`);
    }
    if (config.base?.installed) {
      this.log(`   Base fork:    ${config.base.fork}@${config.base.installed}`);
    }
    if (config.migrationState) {
      this.log(`   State:        ${config.migrationState}`);
    }
  }

  private showNextSteps(status: string, isLegacy: boolean, _hasExtensions: boolean): void {
    if (status === 'Complete') {
      this.log('   ✅ Migration complete!');
      this.log('   • Build: cd packages/shared/mathquill && bun run build');
      this.log('   • Test:  bun test packages/lib-react/math-input');
      this.log('   • Demo:  bun run dev:demo');
      return;
    }

    if (status === 'Pending' && isLegacy) {
      this.log('   📋 Migration needed');
      this.log('   1. Run: pie mathquill:migrate --dry-run');
      this.log('   2. Review the migration plan');
      this.log('   3. Run: pie mathquill:migrate');
      this.log('   4. Test thoroughly before committing');
      return;
    }

    if (status === 'In Progress' || status === 'Transitioning') {
      this.log('   ⚠️  Migration incomplete');
      this.log('   1. Check for errors: pie mathquill:migrate --verbose');
      this.log('   2. Or re-run: pie mathquill:migrate --force');
      return;
    }

    this.log('   ❓ Unknown state - check documentation');
    this.log('   • See: docs/MATHQUILL_MIGRATION_PLAN.md');
    this.log('   • See: docs/MATHQUILL_MIGRATION_CLI_PLAN.md');
  }
}
