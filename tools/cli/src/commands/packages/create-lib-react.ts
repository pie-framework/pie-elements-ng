import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { loadPackageJson } from '../../utils/package-json.js';
import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile, stat as fsStat } from 'node:fs/promises';
import { join } from 'node:path';

interface PackageJson {
  name: string;
  version: string;
  description: string;
  type: string;
  main: string;
  types: string;
  exports: Record<string, unknown>;
  files: string[];
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  keywords: string[];
  license: string;
  repository: {
    type: string;
    url: string;
    directory: string;
  };
}

export default class CreateLibReact extends Command {
  static override description = 'Create package.json files for synced @pie-lib packages';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dry-run',
  ];

  static override flags = {
    'dry-run': Flags.boolean({
      description: 'Show what would be created without making changes',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(CreateLibReact);

    this.logger = new Logger(flags.verbose);

    this.logger.section('📦 Creating package.json files for @pie-lib packages');
    this.logger.info(`   Mode: ${flags['dry-run'] ? 'DRY RUN' : 'LIVE'}\n`);

    const libReactDir = 'packages/lib-react';
    const packages = await readdir(libReactDir);

    let created = 0;
    let skipped = 0;

    for (const pkg of packages) {
      const pkgPath = join(libReactDir, pkg);
      const statResult = await fsStat(pkgPath);

      if (!statResult.isDirectory() || pkg === 'node_modules') {
        continue;
      }

      // Check if src directory exists
      const srcPath = join(pkgPath, 'src');
      if (!existsSync(srcPath)) {
        continue;
      }

      try {
        const packageJsonPath = join(pkgPath, 'package.json');
        if (existsSync(packageJsonPath)) {
          skipped++;
          this.logger.info(`  ⏭️  ${pkg}: Already configured`);
          continue;
        }

        await this.createPackageJson(pkg, flags['dry-run']);
        await this.createViteConfig(pkg, flags['dry-run']);
        await this.createTsConfig(pkg, flags['dry-run']);
        created++;
      } catch (error) {
        this.logger.error(`  ❌ ${pkg}: Error - ${error}`);
      }
    }

    this.logger.success(`\n✅ Created ${created} package configurations`);
    this.logger.info(`⏭️  Skipped ${skipped} existing packages`);

    if (!flags['dry-run'] && created > 0) {
      this.logger.section('\n💡 Next steps');
      this.logger.info('  1. Run: bun install (to link workspace packages)');
      this.logger.info('  2. Run: bun run build --filter="@pie-lib/*" (to build all lib packages)');
      this.logger.info('  3. Update React elements to use the new workspace dependencies\n');
    }
  }

  private async getUpstreamPackageJson(pkgName: string): Promise<PackageJson | null> {
    const upstreamPath = join('../pie-lib/packages', pkgName, 'package.json');
    if (existsSync(upstreamPath)) {
      return (await loadPackageJson(upstreamPath)) as unknown as PackageJson;
    }
    return null;
  }

  private convertDependencies(deps: Record<string, string> | undefined): Record<string, string> {
    if (!deps) return {};

    const converted: Record<string, string> = {};
    for (const [name, version] of Object.entries(deps)) {
      if (name.startsWith('@pie-lib/')) {
        // Convert to workspace dependency
        converted[name] = 'workspace:*';
      } else {
        // Keep external dependencies as-is
        converted[name] = version;
      }
    }
    return converted;
  }

  private async createPackageJson(pkgName: string, dryRun: boolean = false): Promise<void> {
    const targetDir = join('packages/lib-react', pkgName);
    const targetPath = join(targetDir, 'package.json');

    // Skip if package.json already exists
    if (existsSync(targetPath)) {
      this.logger.info(`  ⏭️  ${pkgName}: package.json already exists`);
      return;
    }

    // Get upstream package.json for dependencies
    const upstream = await this.getUpstreamPackageJson(pkgName);

    const packageJson: PackageJson = {
      name: `@pie-lib/${pkgName}`,
      version: '0.1.0',
      description:
        upstream?.description || `React implementation of @pie-lib/${pkgName} synced from pie-lib`,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          default: './dist/index.js',
        },
      },
      files: ['dist', 'src'],
      scripts: {
        build: 'vite build && tsc --emitDeclarationOnly',
        lint: 'biome check .',
        'lint:fix': 'biome check --write .',
      },
      keywords: ['pie', 'pie-lib', 'react', pkgName],
      license: 'ISC',
      repository: {
        type: 'git',
        url: 'https://github.com/pie-framework/pie-elements-ng.git',
        directory: `packages/lib-react/${pkgName}`,
      },
    };

    // Convert dependencies
    if (upstream?.dependencies) {
      packageJson.dependencies = this.convertDependencies(upstream.dependencies);
    }

    if (upstream?.peerDependencies) {
      packageJson.peerDependencies = this.convertDependencies(upstream.peerDependencies);
    }

    // Add common devDependencies
    packageJson.devDependencies = {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.2.0',
      typescript: '^5.9.3',
      vite: '^6.0.0',
    };

    if (dryRun) {
      this.logger.info(`  🔍 ${pkgName}: Would create package.json`);
    } else {
      await mkdir(targetDir, { recursive: true });
      await writeFile(targetPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8');
      this.logger.success(`  ✨ ${pkgName}: Created package.json`);
    }
  }

  private async createViteConfig(pkgName: string, dryRun: boolean = false): Promise<void> {
    const targetDir = join('packages/lib-react', pkgName);
    const targetPath = join(targetDir, 'vite.config.ts');

    // Skip if vite.config.ts already exists
    if (existsSync(targetPath)) {
      return;
    }

    const viteConfig = `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'prop-types',
        'lodash',
        'debug',
        'classnames',
        /^@pie-lib\\//,
        /^@pie-framework\\//,
        /^@pie-element\\//,
        /^@mui\\//,
        /^@emotion\\//,
        /^@dnd-kit\\//,
        /^react-transition-group/,
      ],
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
`;

    if (dryRun) {
      this.logger.info(`  🔍 ${pkgName}: Would create vite.config.ts`);
    } else {
      await writeFile(targetPath, viteConfig, 'utf-8');
    }
  }

  private async createTsConfig(pkgName: string, dryRun: boolean = false): Promise<void> {
    const targetDir = join('packages/lib-react', pkgName);
    const targetPath = join(targetDir, 'tsconfig.json');

    // Skip if tsconfig.json already exists
    if (existsSync(targetPath)) {
      return;
    }

    const tsConfig = {
      extends: '../../../tsconfig.base.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src',
        declaration: true,
        emitDeclarationOnly: false,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.spec.ts', '**/*.spec.tsx'],
    };

    if (dryRun) {
      this.logger.info(`  🔍 ${pkgName}: Would create tsconfig.json`);
    } else {
      await writeFile(targetPath, `${JSON.stringify(tsConfig, null, 2)}\n`, 'utf-8');
    }
  }
}
