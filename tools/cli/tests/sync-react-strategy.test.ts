import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectElementViteEntryPoints,
  ReactComponentsStrategy,
} from '../src/lib/upstream/sync-react-strategy.js';

const createLogger = () =>
  ({
    error: () => {},
    info: () => {},
    isVerbose: () => false,
    progressCompleteWithCount: () => {},
    progressStart: () => {},
    section: () => {},
    success: () => {},
  }) as any;

async function commitPieElementsFixture(pieElementsDir: string): Promise<void> {
  execFileSync('git', ['init'], { cwd: pieElementsDir, stdio: 'ignore' });
  execFileSync('git', ['add', '.'], { cwd: pieElementsDir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['-c', 'user.name=Test User', '-c', 'user.email=test@example.com', 'commit', '-m', 'init'],
    { cwd: pieElementsDir, stdio: 'ignore' }
  );
}

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

describe('ReactComponentsStrategy source tree sync', () => {
  it('syncs source trees into delivery while skipping tests and print files', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-react-tree-test-'));
    const pieElementsDir = join(rootDir, 'upstream', 'pie-elements');
    const upstreamElementDir = join(pieElementsDir, 'packages', 'tree-element');

    await mkdir(join(upstreamElementDir, 'src', 'nested'), { recursive: true });
    await mkdir(join(upstreamElementDir, 'src', '__tests__'), { recursive: true });
    await writeFile(
      join(upstreamElementDir, 'src', 'index.jsx'),
      "import isEmpty from 'lodash/isEmpty';\nexport default function TreeElement() { return <div>{String(isEmpty([]))}</div>; }\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'src', 'nested', 'helper.js'),
      "export const helper = () => 'nested';\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'src', '__tests__', 'ignored.jsx'),
      'export const ignored = () => <div />;\n',
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'src', 'print.jsx'),
      'export default function Print() { return <div />; }\n',
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/tree-element',
          version: '1.2.3',
          dependencies: {
            lodash: '^4.17.21',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await commitPieElementsFixture(pieElementsDir);

    const strategy = new ReactComponentsStrategy();
    const result = await strategy.execute({
      config: {
        dryRun: false,
        pieElements: pieElementsDir,
        pieElementsNg: rootDir,
        pieLib: join(rootDir, 'upstream', 'pie-lib'),
        skipDemos: true,
        syncControllers: false,
        syncPieLib: false,
        syncReactComponents: true,
        upstreamCommit: 'test',
      },
      logger: createLogger(),
      packageFilter: 'tree-element',
    });

    const targetDir = join(rootDir, 'packages', 'elements-react', 'tree-element');
    const deliveryIndex = await readFile(join(targetDir, 'src', 'delivery', 'index.tsx'), 'utf-8');
    const nestedHelper = await readFile(
      join(targetDir, 'src', 'delivery', 'nested', 'helper.ts'),
      'utf-8'
    );
    const rootIndex = await readFile(join(targetDir, 'src', 'index.ts'), 'utf-8');
    const packageJson = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'));

    expect(result.packageNames).toEqual(['tree-element']);
    expect(deliveryIndex).toContain("import { isEmpty } from '@pie-element/shared-lodash';");
    expect(deliveryIndex).toContain(
      '@synced-from pie-elements/packages/tree-element/src/index.jsx'
    );
    expect(nestedHelper).toContain("export const helper = () => 'nested';");
    expect(rootIndex).toBe("export { default } from './delivery/index.js';\n");
    expect(packageJson.dependencies).toHaveProperty('@pie-element/shared-lodash', 'workspace:*');
    expect(existsSync(join(targetDir, 'src', 'delivery', '__tests__'))).toBe(false);
    expect(existsSync(join(targetDir, 'src', 'delivery', 'print.tsx'))).toBe(false);
  });
});
