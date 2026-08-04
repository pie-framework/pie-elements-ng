import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectEntryPoints, detectEntryFile } from '../src/lib/upstream/sync-entry-discovery.js';

describe('sync entry discovery', () => {
  it('detects TypeScript entry files with TSX preferred over TS', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-entry-discovery-test-'));
    await mkdir(join(rootDir, 'src'), { recursive: true });
    await writeFile(join(rootDir, 'src', 'index.ts'), 'export const plain = true;\n');
    await writeFile(join(rootDir, 'src', 'index.tsx'), 'export const jsx = <div />;\n');

    expect(detectEntryFile(rootDir, 'src/index')).toBe('src/index.tsx');
  });

  it('collects configured entries and omits missing ones', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-entry-discovery-test-'));
    await mkdir(join(rootDir, 'src', 'delivery'), { recursive: true });
    await mkdir(join(rootDir, 'src', 'print'), { recursive: true });
    await writeFile(join(rootDir, 'src', 'delivery', 'index.tsx'), 'export default null;\n');
    await writeFile(join(rootDir, 'src', 'print', 'index.ts'), 'export default null;\n');

    expect(
      collectEntryPoints(rootDir, [
        ['delivery/index', 'src/delivery/index'],
        ['author/index', 'src/author/index'],
        ['print/index', 'src/print/index'],
      ])
    ).toEqual({
      'delivery/index': 'src/delivery/index.tsx',
      'print/index': 'src/print/index.ts',
    });
  });
});
