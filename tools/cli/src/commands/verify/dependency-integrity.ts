import { Command, Flags } from '@oclif/core';
import {
  analyzePackageDependencyIntegrity,
  autoFixWorkspaceDependencyDeclarations,
  collectWorkspacePackageDirs,
  type ImportIntegrityIssue,
} from '../../utils/dependency-integrity.js';
import { Logger } from '../../utils/logger.js';

type Row = {
  packageName: string;
  issue: ImportIntegrityIssue;
};

export default class VerifyDependencyIntegrity extends Command {
  static override description =
    'Inspect package imports and classify transitive, hoist-reliant, broken, and missing peer dependency resolution';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --package @pie-element/ebsr',
    '<%= config.bin %> <%= command.id %> --fail-on-hoist',
  ];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
    package: Flags.string({
      description: 'Limit analysis to one package name (eg @pie-element/ebsr)',
    }),
    'include-non-package-workspaces': Flags.boolean({
      description:
        'Also analyze app/tool workspaces (can surface many existing issues outside package code)',
      default: false,
    }),
    'check-peer-gaps': Flags.boolean({
      description:
        'Also validate missing required peer dependencies from declared direct dependencies',
      default: false,
    }),
    fix: Flags.boolean({
      description: 'Auto-add missing direct dependencies for hoist/broken issues before reporting',
      default: false,
    }),
    'fail-on-hoist': Flags.boolean({
      description: 'Exit non-zero when hoist-reliant imports are found',
      default: true,
    }),
    'fail-on-peer': Flags.boolean({
      description: 'Exit non-zero when required peer dependencies are not declared directly',
      default: false,
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyDependencyIntegrity);
    this.logger = new Logger(flags.verbose);

    this.logger.section('🔍 Verifying dependency integrity');

    const repoRoot = process.cwd();
    if (flags.fix) {
      this.logger.info('Applying dependency declaration autofixes...');
      const fixResult = await autoFixWorkspaceDependencyDeclarations(repoRoot, {
        includeNonPackageWorkspaces: flags['include-non-package-workspaces'],
        packageName: flags.package,
        includePeerGaps: flags['check-peer-gaps'],
      });
      this.logger.info(
        `   Scanned: ${fixResult.packagesScanned}, Updated: ${fixResult.packagesUpdated}, Added: ${fixResult.dependenciesAdded}`
      );
      if (fixResult.unresolved.length > 0) {
        this.logger.warn(`   Unresolved: ${fixResult.unresolved.length}`);
        for (const unresolved of fixResult.unresolved) {
          this.logger.warn(`   - ${unresolved.packageName}: ${unresolved.dependency}`);
        }
      }
      this.log('');
    }

    const pkgDirs = await collectWorkspacePackageDirs(repoRoot, {
      includeNonPackageWorkspaces: flags['include-non-package-workspaces'],
    });
    const results = [];

    for (const pkgDir of pkgDirs) {
      const analysis = await analyzePackageDependencyIntegrity(pkgDir, {
        includePeerGaps: flags['check-peer-gaps'],
      });
      if (!analysis) continue;
      if (flags.package && analysis.packageName !== flags.package) continue;
      results.push(analysis);
    }

    if (results.length === 0) {
      this.error(
        flags.package
          ? `Package '${flags.package}' not found in configured workspaces`
          : 'No packages found to inspect',
        { exit: 1 }
      );
    }

    const allIssues: Row[] = [];
    for (const result of results) {
      for (const issue of result.issues) {
        allIssues.push({
          packageName: result.packageName,
          issue,
        });
      }
    }

    const byStatus = {
      transitive: allIssues.filter((r) => r.issue.status === 'transitive'),
      hoist: allIssues.filter((r) => r.issue.status === 'hoist'),
      broken: allIssues.filter((r) => r.issue.status === 'broken'),
      peer: allIssues.filter((r) => r.issue.status === 'peer'),
    };

    this.log(`Packages scanned: ${results.length}`);
    this.log(`Transitive leaks: ${byStatus.transitive.length}`);
    this.log(`Hoist-reliant:    ${byStatus.hoist.length}`);
    this.log(`Broken:           ${byStatus.broken.length}\n`);
    if (flags['check-peer-gaps']) {
      this.log(`Peer gaps:        ${byStatus.peer.length}\n`);
    } else {
      this.log('');
    }

    this.printIssueGroup('❌ Broken imports', byStatus.broken);
    if (flags['check-peer-gaps']) {
      this.printIssueGroup('⚠️  Missing required peer dependencies', byStatus.peer);
    }
    this.printIssueGroup('⚠️  Hoist-reliant imports', byStatus.hoist);
    this.printIssueGroup('ℹ️  Transitive imports (currently resolvable)', byStatus.transitive);

    const shouldFail =
      byStatus.broken.length > 0 ||
      (flags['fail-on-hoist'] && byStatus.hoist.length > 0) ||
      (flags['fail-on-peer'] && byStatus.peer.length > 0);
    if (shouldFail) {
      const failReason =
        byStatus.broken.length > 0
          ? 'Broken imports found'
          : byStatus.hoist.length > 0 && flags['fail-on-hoist']
            ? 'Hoist-reliant imports found (--fail-on-hoist)'
            : 'Missing required peer dependencies found (--fail-on-peer)';
      this.error(failReason, { exit: 1 });
    }

    this.logger.success('Dependency integrity check complete');
  }

  private printIssueGroup(title: string, rows: Row[]): void {
    if (rows.length === 0) return;

    this.log(`${title}:`);
    for (const row of rows) {
      const extra = row.issue.resolvedPath
        ? ` -> ${this.toRepoRelative(row.issue.resolvedPath)}`
        : '';
      const requiredBy = row.issue.requiredBy ? ` (required by ${row.issue.requiredBy})` : '';
      this.log(`  - ${row.packageName}: ${row.issue.dependency}${requiredBy}${extra}`);
    }
    this.log('');
  }

  private toRepoRelative(absolutePath: string): string {
    const repoRoot = process.cwd();
    if (absolutePath.startsWith(repoRoot)) {
      return absolutePath.slice(repoRoot.length + 1);
    }

    return absolutePath;
  }
}
