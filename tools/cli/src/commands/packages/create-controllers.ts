import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { extractDependencies } from '../../utils/package-json.js';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SHARED_DIR = 'packages/shared';

export default class CreateControllers extends Command {
  static override description = 'Create package.json files for synced controllers';

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
    const { flags } = await this.parse(CreateControllers);

    this.logger = new Logger(flags.verbose);

    this.logger.section('📦 Creating package.json files for controllers');

    const controllers = await readdir(SHARED_DIR);
    let created = 0;
    let skipped = 0;

    for (const controller of controllers) {
      const controllerDir = join(SHARED_DIR, controller);
      const packageJsonPath = join(controllerDir, 'package.json');

      // Skip if package.json already exists
      if (existsSync(packageJsonPath)) {
        this.logger.info(`  ⏭️  ${controller}: package.json already exists`);
        skipped++;
        continue;
      }

      // Scan for dependencies
      const deps = await this.scanController(controllerDir);

      // Generate package.json
      const content = this.generatePackageJson(controller, deps);

      // Write file
      await writeFile(packageJsonPath, content, 'utf-8');
      this.logger.success(`  ✅ ${controller}: Created package.json (${deps.length} dependencies)`);
      created++;
    }

    this.logger.section(`\n📊 Summary: ${created} created, ${skipped} skipped`);
  }

  private async scanController(controllerDir: string): Promise<string[]> {
    const srcDir = join(controllerDir, 'src');
    const deps = new Set<string>();

    if (!existsSync(srcDir)) {
      return [];
    }

    const files = await readdir(srcDir);

    for (const file of files) {
      if (!file.endsWith('.ts')) continue;

      const filePath = join(srcDir, file);
      const content = await readFile(filePath, 'utf-8');
      const fileDeps = extractDependencies(content);

      for (const dep of fileDeps) deps.add(dep);
    }

    return Array.from(deps).sort();
  }

  private generatePackageJson(name: string, deps: string[]): string {
    const dependencies: Record<string, string> = {};

    for (const dep of deps) {
      // Use * for external dependencies (they're in root package.json)
      dependencies[dep] = '*';
    }

    const pkg = {
      name: `@pie-element/${name}`,
      version: '0.1.0',
      description: `Framework-agnostic ${name.replace('-controller', '')} controller synced from pie-elements`,
      type: 'module',
      main: './src/index.ts',
      types: './src/index.ts',
      exports: {
        '.': {
          types: './src/index.ts',
          default: './src/index.ts',
        },
      },
      files: ['src'],
      scripts: {
        build: "echo 'Controllers are consumed as TypeScript source'",
        lint: 'biome check .',
        'lint:fix': 'biome check --write .',
      },
      dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
      keywords: ['pie', 'pie-element', 'controller', name.replace('-controller', ''), 'assessment'],
      license: 'ISC',
      repository: {
        type: 'git',
        url: 'https://github.com/pie-framework/pie-elements-ng.git',
        directory: `packages/shared/${name}`,
      },
    };

    // Remove undefined fields
    const cleaned = JSON.parse(JSON.stringify(pkg));

    return `${JSON.stringify(cleaned, null, 2)}\n`;
  }
}
