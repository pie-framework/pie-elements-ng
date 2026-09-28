import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The translator source is @ts-nocheck, so its shipped declaration is only checked here, the
// way a client with skipLibCheck off reads it.
describe('@pie-lib/translator declarations', () => {
  it('type-check with skipLibCheck off', () => {
    const declaration = join(process.cwd(), 'packages/shared/translator/dist/index.js');
    const dir = mkdtempSync(join(tmpdir(), 'pie-translator-dts-'));
    writeFileSync(
      join(dir, 'probe.ts'),
      `import translatorModule from ${JSON.stringify(declaration)};\nexport const label: string = translatorModule.translator.t('key', {});\n`
    );
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          skipLibCheck: false,
          module: 'ESNext',
          moduleResolution: 'bundler',
          target: 'ES2022',
          noEmit: true,
          types: [],
        },
        files: ['probe.ts'],
      })
    );
    const result = spawnSync(
      process.execPath,
      [join(process.cwd(), 'node_modules/typescript/bin/tsc'), '-p', dir],
      { encoding: 'utf8' }
    );
    expect(result.stdout + result.stderr).toBe('');
    expect(result.status).toBe(0);
  });
});
