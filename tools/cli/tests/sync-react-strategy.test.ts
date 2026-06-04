import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectElementViteEntryPoints } from '../src/lib/upstream/sync-react-strategy.js';

describe('collectElementViteEntryPoints', () => {
  it('includes runtime-support when the generated source exists', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-react-sync-test-'));
    const elementDir = join(rootDir, 'packages', 'elements-react', 'test-element');
    await mkdir(join(elementDir, 'src'), { recursive: true });
    await writeFile(join(elementDir, 'src', 'index.ts'), 'export default class TestElement {}\n');
    await writeFile(
      join(elementDir, 'src', 'runtime-support.ts'),
      'export default { schemaVersion: 1 };\n'
    );

    const entries = collectElementViteEntryPoints(elementDir);

    expect(entries).toMatchObject({
      index: 'src/index.ts',
      'runtime-support': 'src/runtime-support.ts',
    });
  });
});
