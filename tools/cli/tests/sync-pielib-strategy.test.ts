import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PieLibStrategy } from '../src/lib/upstream/sync-pielib-strategy.js';

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

async function commitPieLibFixture(pieLibDir: string): Promise<void> {
  execFileSync('git', ['init'], { cwd: pieLibDir, stdio: 'ignore' });
  execFileSync('git', ['add', '.'], { cwd: pieLibDir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['-c', 'user.name=Test User', '-c', 'user.email=test@example.com', 'commit', '-m', 'init'],
    { cwd: pieLibDir, stdio: 'ignore' }
  );
}

describe('PieLibStrategy autosize input generation', () => {
  it('generates the local autosize component when syncing graph label sources', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const pieLibDir = join(rootDir, 'upstream', 'pie-lib');
    const upstreamGraphingDir = join(pieLibDir, 'packages', 'graphing');

    await mkdir(join(upstreamGraphingDir, 'src'), { recursive: true });
    await writeFile(
      join(upstreamGraphingDir, 'src', 'mark-label.jsx'),
      'import AutosizeInput from \'react-input-autosize\';\nexport const Label = () => <AutosizeInput value="x" />;\n',
      'utf-8'
    );
    await writeFile(
      join(upstreamGraphingDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/graphing',
          version: '1.0.0',
          dependencies: {
            'react-input-autosize': '^2.2.1',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await commitPieLibFixture(pieLibDir);

    const strategy = new PieLibStrategy();
    const result = await strategy.execute({
      config: {
        dryRun: false,
        pieElements: join(rootDir, 'upstream', 'pie-elements'),
        pieElementsNg: rootDir,
        pieLib: pieLibDir,
        pieLibPackages: ['graphing'],
        skipDemos: true,
        syncControllers: false,
        syncPieLib: true,
        syncReactComponents: false,
        upstreamCommit: 'test',
      },
      logger: createLogger(),
    });

    const targetSrcDir = join(rootDir, 'packages', 'lib-react', 'graphing', 'src');
    const markLabel = await readFile(join(targetSrcDir, 'mark-label.tsx'), 'utf-8');
    const autosizeInput = await readFile(join(targetSrcDir, 'autosize-input.tsx'), 'utf-8');
    const packageJson = JSON.parse(
      await readFile(join(rootDir, 'packages', 'lib-react', 'graphing', 'package.json'), 'utf-8')
    );

    expect(result.packageNames).toEqual(['@pie-lib/graphing']);
    expect(markLabel).toContain("import { AutosizeInput } from './autosize-input.js';");
    expect(autosizeInput).toContain('export const AutosizeInput = React.forwardRef');
    expect(packageJson.dependencies ?? {}).not.toHaveProperty('react-input-autosize');
  });
});
