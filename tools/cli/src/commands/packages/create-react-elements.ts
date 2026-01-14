import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile, stat as fsStat } from 'node:fs/promises';
import { join } from 'node:path';

const ELEMENTS_REACT_DIR = 'packages/elements-react';

interface ElementDeps {
  deps: Set<string>;
  peerDeps: Set<string>;
}

export default class CreateReactElements extends Command {
  static override description = 'Create package.json files for synced React elements';

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
    const { flags } = await this.parse(CreateReactElements);

    this.logger = new Logger(flags.verbose);

    this.logger.section('📦 Creating package.json files for React elements');

    const elements = await readdir(ELEMENTS_REACT_DIR);
    let created = 0;
    let skipped = 0;

    for (const element of elements) {
      const elementDir = join(ELEMENTS_REACT_DIR, element);
      const packageJsonPath = join(elementDir, 'package.json');

      // Skip if not a directory
      const statResult = await fsStat(elementDir).catch(() => null);
      if (!statResult?.isDirectory()) {
        continue;
      }

      // Skip if package.json already exists
      if (existsSync(packageJsonPath)) {
        this.logger.info(`  ⏭️  ${element}: package.json already exists`);
        skipped++;
        continue;
      }

      // Scan for dependencies
      const { deps, peerDeps } = await this.scanElement(elementDir);

      // Add controller package as a dependency
      const controllerPkg = `@pie-elements-ng/${element}-controller`;
      deps.add(controllerPkg);

      // Generate package.json
      const packageContent = this.generatePackageJson(
        element,
        Array.from(deps),
        Array.from(peerDeps)
      );

      // Write package.json
      await writeFile(packageJsonPath, packageContent, 'utf-8');

      // Generate vite.config.ts
      const viteConfigPath = join(elementDir, 'vite.config.ts');
      if (!existsSync(viteConfigPath)) {
        await writeFile(viteConfigPath, this.generateViteConfig(), 'utf-8');
      }

      // Generate tsconfig.json
      const tsconfigPath = join(elementDir, 'tsconfig.json');
      if (!existsSync(tsconfigPath)) {
        await writeFile(tsconfigPath, this.generateTsConfig(), 'utf-8');
      }

      this.logger.success(
        `  ✅ ${element}: Created package.json (${deps.size} deps, ${peerDeps.size} peer deps)`
      );
      created++;
    }

    this.logger.section(`\n📊 Summary: ${created} created, ${skipped} skipped`);
  }

  private async scanElement(elementDir: string): Promise<ElementDeps> {
    const srcDir = join(elementDir, 'src');
    const deps = new Set<string>();
    const peerDeps = new Set<string>();

    if (!existsSync(srcDir)) {
      return { deps, peerDeps };
    }

    // Recursively scan all .ts and .tsx files
    const scanDir = async (dir: string): Promise<void> => {
      const items = await readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = join(dir, item.name);

        if (item.isDirectory()) {
          await scanDir(itemPath);
        } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
          const content = await readFile(itemPath, 'utf-8');
          const fileDeps = this.extractDeps(content);

          for (const dep of fileDeps.deps) deps.add(dep);
          for (const dep of fileDeps.peerDeps) peerDeps.add(dep);
        }
      }
    };

    await scanDir(srcDir);

    return { deps, peerDeps };
  }

  private extractDeps(content: string): { deps: string[]; peerDeps: string[] } {
    const deps = new Set<string>();
    const peerDeps = new Set<string>();

    // Match import statements
    const importRegex = /^import .* from ['"]([^'"]+)['"]/gm;
    const matches = content.matchAll(importRegex);

    for (const match of matches) {
      const dep = match[1];

      // Skip relative imports
      if (dep.startsWith('.')) continue;

      // React is a peer dependency
      if (dep === 'react' || dep.startsWith('react/')) {
        peerDeps.add('react');
        continue;
      }
      if (dep === 'react-dom' || dep.startsWith('react-dom/')) {
        peerDeps.add('react-dom');
        continue;
      }

      // Add @pie-lib packages
      if (dep.startsWith('@pie-lib/')) {
        deps.add(dep.split('/').slice(0, 2).join('/'));
      }
      // Add @pie-element packages (controller packages)
      else if (dep.startsWith('@pie-elements-ng/')) {
        deps.add(dep.split('/').slice(0, 2).join('/'));
      }
      // Add other scoped packages
      else if (dep.startsWith('@')) {
        deps.add(dep.split('/').slice(0, 2).join('/'));
      }
      // Add non-scoped packages
      else if (!dep.includes('/')) {
        deps.add(dep);
      } else {
        // Package with sub-path (e.g., lodash/get)
        deps.add(dep.split('/')[0]);
      }
    }

    return {
      deps: Array.from(deps).sort(),
      peerDeps: Array.from(peerDeps).sort(),
    };
  }

  private generatePackageJson(name: string, deps: string[], peerDeps: string[]): string {
    const dependencies: Record<string, string> = {};
    const peerDependencies: Record<string, string> = {};

    // Add dependencies (use * for external deps, they're in root package.json)
    for (const dep of deps) {
      // Use workspace protocol for internal packages
      if (dep.startsWith('@pie-elements-ng/') || dep.startsWith('@pie-shared/')) {
        dependencies[dep] = 'workspace:*';
      } else {
        dependencies[dep] = '*';
      }
    }

    // Add peer dependencies
    for (const dep of peerDeps) {
      peerDependencies[dep] = '^18.0.0';
    }

    const pkg = {
      name: `@pie-element/${name}`,
      version: '0.1.0',
      description: `React implementation of ${name} element synced from pie-elements`,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          default: './dist/index.js',
        },
        './delivery': {
          types: './dist/delivery/index.d.ts',
          default: './dist/delivery/index.js',
        },
        './configure': {
          types: './dist/configure/index.d.ts',
          default: './dist/configure/index.js',
        },
        './controller': {
          types: './dist/controller/index.d.ts',
          default: './dist/controller/index.js',
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
      dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
      peerDependencies: Object.keys(peerDependencies).length > 0 ? peerDependencies : undefined,
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        typescript: '^5.9.3',
        vite: '^6.0.0',
        vitest: '^2.1.0',
      },
      keywords: ['pie', 'pie-element', 'react', name, 'assessment'],
      license: 'ISC',
      repository: {
        type: 'git',
        url: 'https://github.com/pie-framework/pie-elements-ng.git',
        directory: `packages/elements-react/${name}`,
      },
    };

    // Remove undefined fields
    const cleaned = JSON.parse(JSON.stringify(pkg));

    return `${JSON.stringify(cleaned, null, 2)}\n`;
  }

  private generateViteConfig(): string {
    return `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'delivery/index': resolve(__dirname, 'src/index.ts'),
        'configure/index': resolve(__dirname, 'src/configure/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        /^react($|\\/)/,
        /^react-dom($|\\/)/,
        /^@pie-lib/,
        /^@pie-elements-ng/,
        /^@pie-framework/,
        /^@mui/,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
`;
  }

  private generateTsConfig(): string {
    return `{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "declaration": true,
    "emitDeclarationOnly": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
`;
  }
}
