import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { loadPackageJson, type PackageJson } from '../../utils/package-json.js';
import { existsSync } from 'node:fs';

interface DependencyReport {
  library: string;
  pieElements?: string;
  pieLib?: string;
  pieElementsNg?: string;
  status: 'ok' | 'outdated' | 'missing' | 'newer' | 'not-used-upstream';
  recommendation?: string;
}

// Libraries we care about tracking
const TRACKED_DEPS = [
  // Math rendering
  'mathjax-full',
  'mathlive',

  // Sanitization
  'dompurify',

  // Rich text
  '@tiptap/core',
  '@tiptap/pm',
  '@tiptap/starter-kit',
  '@tiptap/extension-image',
  '@tiptap/extension-link',
  '@tiptap/extension-table',
  '@tiptap/extension-task-list',

  // PIE framework
  '@pie-framework/pie-player-events',
  '@pie-framework/pie-configure-events',

  // Utilities (note: lodash is replaced with lodash-es during sync)
  'lodash-es',
  'uuid',
];

export default class Deps extends Command {
  static override description = 'Compare dependencies with upstream and suggest updates';

  static override examples = ['<%= config.bin %> <%= command.id %>'];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deps);

    this.logger = new Logger(flags.verbose);

    this.logger.section('📦 Dependency Check Report');

    // Read all package.json files
    const pieElementsPkg = await this.loadPackage('../pie-elements/package.json');
    const pieLibPkg = await this.loadPackage('../pie-lib/package.json');
    const pieElementsNgPkg = await this.loadPackage('./package.json');

    if (!pieElementsPkg) {
      this.error('Could not load pie-elements package.json');
    }
    if (!pieLibPkg) {
      this.error('Could not load pie-lib package.json');
    }
    if (!pieElementsNgPkg) {
      this.error('Could not load pie-elements-ng package.json');
    }

    const reports: DependencyReport[] = [];

    for (const dep of TRACKED_DEPS) {
      const report: DependencyReport = {
        library: dep,
        pieElements: this.getDep(pieElementsPkg, dep),
        pieLib: this.getDep(pieLibPkg, dep),
        pieElementsNg: this.getDep(pieElementsNgPkg, dep),
        status: 'ok',
      };

      // Determine status
      const upstreamVersion = report.pieElements || report.pieLib;
      const currentVersion = report.pieElementsNg;

      if (!upstreamVersion && !currentVersion) {
        report.status = 'not-used-upstream';
        continue; // Skip reporting
      }

      if (!currentVersion && upstreamVersion) {
        report.status = 'missing';
        report.recommendation = `Install ${dep}@${upstreamVersion}`;
      } else if (currentVersion && upstreamVersion && currentVersion !== upstreamVersion) {
        const comparison = this.compareVersions(currentVersion, upstreamVersion);
        if (comparison < 0) {
          report.status = 'outdated';
          report.recommendation = `Update from ${currentVersion} to ${upstreamVersion}`;
        } else if (comparison > 0) {
          report.status = 'newer';
          report.recommendation = `Already on newer version (${currentVersion} > ${upstreamVersion})`;
        } else {
          report.status = 'ok';
        }
      }

      reports.push(report);
    }

    // Print summary table
    this.log(
      '┌─────────────────────────────────────────┬──────────────┬──────────────┬──────────────┬──────────┐'
    );
    this.log(
      '│ Library                                 │ pie-elements │ pie-lib      │ pie-elem-ng  │ Status   │'
    );
    this.log(
      '├─────────────────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────┤'
    );

    for (const r of reports) {
      if (r.status === 'not-used-upstream') continue;

      const lib = r.library.padEnd(39);
      const pe = (r.pieElements || '-').padEnd(12);
      const pl = (r.pieLib || '-').padEnd(12);
      const peng = (r.pieElementsNg || '-').padEnd(12);

      let statusIcon = '✅';
      if (r.status === 'outdated') statusIcon = '⚠️ ';
      else if (r.status === 'missing') statusIcon = '❌';
      else if (r.status === 'newer') statusIcon = '🆙';

      this.log(`│ ${lib} │ ${pe} │ ${pl} │ ${peng} │ ${statusIcon}      │`);
    }

    this.log(
      '└─────────────────────────────────────────┴──────────────┴──────────────┴──────────────┴──────────┘'
    );

    // Print actionable recommendations
    const actionable = reports.filter(
      (r) => r.recommendation && r.status !== 'ok' && r.status !== 'newer'
    );

    if (actionable.length > 0) {
      this.logger.section('\n🔧 Recommended Actions');
      for (const r of actionable) {
        this.logger.info(`  ${r.recommendation}`);
      }
      this.log('');
    }

    const newer = reports.filter((r) => r.status === 'newer');
    if (newer.length > 0) {
      this.logger.info('ℹ️  Libraries where pie-elements-ng is ahead:\n');
      for (const r of newer) {
        this.logger.info(
          `  ${r.library}: ${r.pieElementsNg} (upstream: ${r.pieElements || r.pieLib || '-'})`
        );
      }
      this.log('');
    }

    const allOk = reports.filter((r) => r.status === 'ok');
    if (actionable.length === 0 && newer.length === 0) {
      this.logger.success('\n✅ All dependencies in sync!');
    } else {
      this.logger.info(
        `\n📊 Summary: ${allOk.length} in sync, ${actionable.length} need updates, ${newer.length} ahead\n`
      );
    }
  }

  private async loadPackage(path: string): Promise<PackageJson | null> {
    try {
      if (!existsSync(path)) {
        return null;
      }
      return await loadPackageJson(path);
    } catch (error) {
      this.logger.error(`Error loading ${path}: ${error}`);
      return null;
    }
  }

  private getDep(pkg: PackageJson | null, name: string): string | undefined {
    if (!pkg) return undefined;
    return pkg.dependencies?.[name] || pkg.devDependencies?.[name];
  }

  private cleanVersion(version: string): string {
    // Remove ^, ~, >=, etc. for comparison
    return version.replace(/^[\^~>=<]+/, '');
  }

  private compareVersions(v1: string, v2: string): number {
    const clean1 = this.cleanVersion(v1);
    const clean2 = this.cleanVersion(v2);

    const parts1 = clean1.split('.').map(Number);
    const parts2 = clean2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const n1 = parts1[i] || 0;
      const n2 = parts2[i] || 0;

      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }

    return 0;
  }
}
