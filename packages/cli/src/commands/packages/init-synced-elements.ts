import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile, stat as fsStat } from 'node:fs/promises';
import { join } from 'node:path';

const ELEMENTS_REACT_DIR = 'packages/elements-react';
const PIE_ELEMENTS_DIR = '../pie-elements/packages';

interface PackageTemplate {
  name: string;
  private: boolean;
  version: string;
  description: string;
  type: string;
  main: string;
  types: string;
  exports: Record<string, unknown>;
  files: string[];
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  keywords: string[];
  license: string;
  repository: {
    type: string;
    url: string;
    directory: string;
  };
}

export default class InitSyncedElements extends Command {
  static override description =
    'Initialize package.json and vite.config.ts files for synced React elements';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --element=categorize',
    '<%= config.bin %> <%= command.id %> --dry-run',
  ];

  static override flags = {
    element: Flags.string({
      description: 'Initialize only specified element',
    }),
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
    const { flags } = await this.parse(InitSyncedElements);

    this.logger = new Logger(flags.verbose);

    this.logger.section('🔧 Initializing synced React elements');

    if (flags['dry-run']) {
      this.logger.info('   Mode: DRY RUN\n');
    }

    const elements = await readdir(ELEMENTS_REACT_DIR);
    let created = 0;
    let skipped = 0;

    for (const element of elements) {
      // Skip if filtering by element and this isn't it
      if (flags.element && element !== flags.element) {
        continue;
      }

      const elementDir = join(ELEMENTS_REACT_DIR, element);

      // Skip if not a directory
      const statResult = await fsStat(elementDir).catch(() => null);
      if (!statResult?.isDirectory()) {
        continue;
      }

      // Skip if src directory doesn't exist
      if (!existsSync(join(elementDir, 'src'))) {
        continue;
      }

      const packageJsonPath = join(elementDir, 'package.json');

      // Skip if package.json already exists
      if (existsSync(packageJsonPath)) {
        if (flags.verbose) {
          this.logger.info(`  ⏭️  ${element}: package.json already exists`);
        }
        skipped++;
        continue;
      }

      // Read upstream package.json
      const upstreamPkg = await this.readUpstreamPackageJson(element);
      if (!upstreamPkg) {
        this.logger.warn(`  ⚠️  ${element}: Could not read upstream package.json`);
        continue;
      }

      // Generate package.json
      const pkg = this.generatePackageJson(element, upstreamPkg);

      if (!flags['dry-run']) {
        await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
        this.logger.success(`  ✨ ${element}: Created package.json`);
      } else {
        this.logger.info(`  🔍 ${element}: Would create package.json`);
      }

      // Generate vite.config.ts
      const viteConfigPath = join(elementDir, 'vite.config.ts');
      if (!existsSync(viteConfigPath)) {
        if (!flags['dry-run']) {
          await writeFile(viteConfigPath, this.generateViteConfig(), 'utf-8');
          this.logger.success(`  ✨ ${element}: Created vite.config.ts`);
        } else {
          this.logger.info(`  🔍 ${element}: Would create vite.config.ts`);
        }
      }

      created++;
    }

    this.logger.section(
      `\n📊 Summary: ${created} ${flags['dry-run'] ? 'would be created' : 'created'}, ${skipped} skipped`
    );
  }

  private async readUpstreamPackageJson(
    elementName: string
  ): Promise<Record<string, unknown> | null> {
    const upstreamPath = join(PIE_ELEMENTS_DIR, elementName, 'package.json');

    if (!existsSync(upstreamPath)) {
      return null;
    }

    try {
      const content = await readFile(upstreamPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private generatePackageJson(
    elementName: string,
    upstreamPkg: Record<string, unknown>
  ): PackageTemplate {
    const deps: Record<string, string> = {};

    // Map upstream dependencies to workspace:* for @pie-lib packages
    const upstreamDeps = upstreamPkg.dependencies as Record<string, string> | undefined;
    if (upstreamDeps) {
      for (const [name] of Object.entries(upstreamDeps)) {
        if (name.startsWith('@pie-lib/')) {
          deps[name] = 'workspace:*';
        } else if (!name.startsWith('react') && name !== 'react-dom') {
          deps[name] = '*';
        }
      }
    }

    return {
      name: `@pie-element/${elementName}`,
      private: true,
      version: '0.1.0',
      description: `React implementation of ${elementName} element synced from pie-elements`,
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
        dev: 'vite',
        build: 'vite build && tsc --emitDeclarationOnly',
        test: 'vitest run',
        lint: 'biome check .',
        'lint:fix': 'biome check --write .',
      },
      dependencies: deps,
      peerDependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        typescript: '^5.9.3',
        vite: '^6.0.0',
        vitest: '^2.1.0',
      },
      keywords: ['pie', 'pie-element', 'react', 'assessment', elementName],
      license: 'ISC',
      repository: {
        type: 'git',
        url: 'https://github.com/pie-framework/pie-elements-ng.git',
        directory: `packages/elements-react/${elementName}`,
      },
    };
  }

  private generateViteConfig(): string {
    return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        return (
          /^react($|\\/)/.test(id) ||
          /^react-dom($|\\/)/.test(id) ||
          /^@pie-lib\\//.test(id) ||
          /^@pie-elements-ng\\//.test(id) ||
          /^@pie-framework\\//.test(id) ||
          /^@mui\\//.test(id) ||
          /^d3-/.test(id) ||
          id === 'lodash' ||
          /^lodash\\//.test(id) ||
          ['prop-types', 'classnames', 'debug'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
`;
  }
}
