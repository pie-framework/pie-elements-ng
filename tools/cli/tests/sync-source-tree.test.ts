import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RETIRED_UPSTREAM_SOURCE_FILES } from '../src/lib/upstream/sync-constants.js';
import { syncSourceTree } from '../src/lib/upstream/sync-source-tree.js';

describe('syncSourceTree retired files', () => {
  it('does not re-emit a retired upstream source file', async () => {
    expect(RETIRED_UPSTREAM_SOURCE_FILES.has('pie-lib/packages/drag/src/drag-type.js')).toBe(true);

    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-source-tree-'));
    const sourceDir = join(rootDir, 'upstream', 'src');
    const targetDir = join(rootDir, 'target', 'src');
    await mkdir(sourceDir, { recursive: true });
    await writeFile(join(sourceDir, 'drag-type.js'), 'export default { types: {} };\n', 'utf-8');
    await writeFile(join(sourceDir, 'swap.js'), 'export const swap = (a) => a;\n', 'utf-8');

    await syncSourceTree({
      sourceDir,
      targetDir,
      relativePath: 'src',
      sourcePathPrefix: 'pie-lib/packages/drag',
      upstreamCommit: 'test',
      transform: (content) => content,
    });

    expect(existsSync(join(targetDir, 'swap.ts'))).toBe(true);
    expect(existsSync(join(targetDir, 'drag-type.ts'))).toBe(false);
  });
});
