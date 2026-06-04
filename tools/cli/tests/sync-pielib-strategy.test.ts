import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

  it('generates the config-ui fraction helper when syncing fraction input sources', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-sync-test-'));
    const pieLibDir = join(rootDir, 'upstream', 'pie-lib');
    const upstreamConfigUiDir = join(pieLibDir, 'packages', 'config-ui');

    await mkdir(join(upstreamConfigUiDir, 'src'), { recursive: true });
    await writeFile(
      join(upstreamConfigUiDir, 'src', 'number-text-field-custom.jsx'),
      "import * as math from 'mathjs';\nexport const distance = (value, number) => Math.abs(math.number(math.fraction(value)) - math.number(math.fraction(number)));\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamConfigUiDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/config-ui',
          version: '1.0.0',
          dependencies: {
            mathjs: '^7.5.1',
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
        pieLibPackages: ['config-ui'],
        skipDemos: true,
        syncControllers: false,
        syncPieLib: true,
        syncReactComponents: false,
        upstreamCommit: 'test',
      },
      logger: createLogger(),
    });

    const targetSrcDir = join(rootDir, 'packages', 'lib-react', 'config-ui', 'src');
    const numberTextField = await readFile(
      join(targetSrcDir, 'number-text-field-custom.tsx'),
      'utf-8'
    );
    const fractionHelper = await readFile(join(targetSrcDir, 'fraction-to-number.ts'), 'utf-8');
    const packageJson = JSON.parse(
      await readFile(join(rootDir, 'packages', 'lib-react', 'config-ui', 'package.json'), 'utf-8')
    );

    expect(result.packageNames).toEqual(['@pie-lib/config-ui']);
    expect(numberTextField).toContain(
      "import { fractionToNumber } from './fraction-to-number.js';"
    );
    expect(numberTextField).toContain(
      'Math.abs(fractionToNumber(value) - fractionToNumber(number))'
    );
    expect(numberTextField).not.toContain('mathjs');
    expect(fractionHelper).toContain('export const fractionToNumber');
    expect(packageJson.dependencies ?? {}).not.toHaveProperty('mathjs');
  });
});

describe('PieLibStrategy source tree sync', () => {
  it('syncs nested source trees while applying transforms and skipping test folders', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-pielib-tree-test-'));
    const pieLibDir = join(rootDir, 'upstream', 'pie-lib');
    const upstreamToolsDir = join(pieLibDir, 'packages', 'tools');

    await mkdir(join(upstreamToolsDir, 'src', 'nested'), { recursive: true });
    await mkdir(join(upstreamToolsDir, 'src', '__tests__'), { recursive: true });
    await writeFile(
      join(upstreamToolsDir, 'src', 'index.js'),
      "import classNames from 'classnames';\nexport const label = classNames('a', false && 'b');\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamToolsDir, 'src', 'nested', 'button.jsx'),
      "import isEmpty from 'lodash/isEmpty';\nexport const Button = () => <button>{String(isEmpty([]))}</button>;\n",
      'utf-8'
    );
    await writeFile(
      join(upstreamToolsDir, 'src', '__tests__', 'ignored.js'),
      'export const ignored = true;\n',
      'utf-8'
    );
    await writeFile(
      join(upstreamToolsDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-lib/tools',
          version: '1.0.0',
          dependencies: {
            classnames: '^2.5.1',
            lodash: '^4.17.21',
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
        pieLibPackages: ['tools'],
        skipDemos: true,
        syncControllers: false,
        syncPieLib: true,
        syncReactComponents: false,
        upstreamCommit: 'test',
      },
      logger: createLogger(),
    });

    const targetDir = join(rootDir, 'packages', 'lib-react', 'tools');
    const index = await readFile(join(targetDir, 'src', 'index.ts'), 'utf-8');
    const nestedButton = await readFile(join(targetDir, 'src', 'nested', 'button.tsx'), 'utf-8');
    const packageJson = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'));

    expect(result.packageNames).toEqual(['@pie-lib/tools']);
    expect(index).toContain("import classNames from 'clsx';");
    expect(index).toContain('@synced-from pie-lib/packages/tools/src/index.js');
    expect(nestedButton).toContain("import { isEmpty } from '@pie-element/shared-lodash';");
    expect(packageJson.dependencies).toHaveProperty('clsx', '^2.1.1');
    expect(packageJson.dependencies).toHaveProperty('@pie-element/shared-lodash', 'workspace:*');
    expect(existsSync(join(targetDir, 'src', '__tests__'))).toBe(false);
  });
});
