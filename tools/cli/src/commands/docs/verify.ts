import { Command, Flags } from '@oclif/core';
import DocsGenerate from './generate.js';

export default class DocsVerify extends Command {
  static override description =
    'Verify PIE docs contracts and generated HTML docs artifacts are up to date';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --framework=svelte',
  ];

  static override flags = {
    framework: Flags.string({
      description: 'Framework filter',
      options: ['react', 'svelte', 'all'],
      default: 'all',
    }),
    element: Flags.string({
      description: 'Verify one element name',
    }),
    output: Flags.string({
      description: 'Output base directory',
      default: 'apps/element-demo/static/element-docs',
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Verbose logging',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DocsVerify);
    const forward = ['--check', `--framework=${flags.framework}`, `--output=${flags.output}`];
    if (flags.element) {
      forward.push(`--element=${flags.element}`);
    }
    if (flags.verbose) {
      forward.push('--verbose');
    }

    await DocsGenerate.run(forward);
  }
}
