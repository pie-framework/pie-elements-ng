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

  it('regenerates EBSR version-scoped private child element wiring after upstream sync', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-react-ebsr-sync-test-'));
    const pieElementsDir = join(rootDir, 'upstream', 'pie-elements');
    const upstreamElementDir = join(pieElementsDir, 'packages', 'ebsr');

    await mkdir(join(upstreamElementDir, 'src'), { recursive: true });
    await mkdir(join(upstreamElementDir, 'configure', 'src'), { recursive: true });
    await writeFile(
      join(upstreamElementDir, 'src', 'index.jsx'),
      `import MultipleChoice from '@pie-element/multiple-choice';
import debug from 'debug';
const MC_TAG_NAME = 'ebsr-multiple-choice';
class EbsrMC extends MultipleChoice {}
customElements.define(MC_TAG_NAME, EbsrMC);
export default class EbsrElement extends HTMLElement {}
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'src', 'print.jsx'),
      `import MultipleChoice from '@pie-element/multiple-choice';
import { SessionChangedEvent } from '@pie-framework/pie-player-events';
const MC_TAG_NAME = 'ebsr-multiple-choice';
class EbsrMC extends MultipleChoice {}
customElements.define(MC_TAG_NAME, EbsrMC);
export default class EbsrPrintElement extends HTMLElement {}
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'configure', 'src', 'index.js'),
      `import React from 'react';
import { createRoot } from 'react-dom/client';
import MultipleChoiceConfigure from '@pie-element/multiple-choice/configure/lib';
import Main from './main';
const MC_TAG_NAME = 'ebsr-multiple-choice-configure';
class EbsrMCConfigure extends MultipleChoiceConfigure {}
customElements.define(MC_TAG_NAME, EbsrMCConfigure);
export default class EbsrConfigure extends HTMLElement {
  _render() {
    let element = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
    });
    createRoot(this).render(element);
  }
}
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'configure', 'src', 'main.jsx'),
      `import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
export class Main extends React.Component {
  static propTypes = {
    configuration: PropTypes.object,
    model: PropTypes.object,
    onModelChanged: PropTypes.func,
    onConfigurationChanged: PropTypes.func,
  };
  render() {
    const { model, configuration, onConfigurationChanged } = this.props;
    return (
      <ebsr-multiple-choice-configure
        ref={(ref) => {
          if (ref) {
            ref.model = model.partA;
            ref.configuration = configuration.partA;
            onConfigurationChanged?.(configuration);
          }
        }}
      />
    );
  }
}
export default Main;
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify({ name: '@pie-element/ebsr', version: '1.2.3' }, null, 2),
      'utf-8'
    );
    await commitPieElementsFixture(pieElementsDir);

    const strategy = new ReactComponentsStrategy();
    await strategy.execute({
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
      packageFilter: 'ebsr',
    });

    const targetDir = join(rootDir, 'packages', 'elements-react', 'ebsr');
    const privateTags = await readFile(join(targetDir, 'src', 'private-tags.ts'), 'utf-8');
    const deliveryIndex = await readFile(join(targetDir, 'src', 'delivery', 'index.tsx'), 'utf-8');
    const authorIndex = await readFile(join(targetDir, 'src', 'author', 'index.ts'), 'utf-8');
    const authorMain = await readFile(join(targetDir, 'src', 'author', 'main.tsx'), 'utf-8');
    const viteConfig = await readFile(join(targetDir, 'vite.config.ts'), 'utf-8');
    const iifeConfig = await readFile(join(targetDir, 'vite.config.iife.ts'), 'utf-8');

    expect(privateTags).toContain('EBSR_MULTIPLE_CHOICE_TAG');
    expect(privateTags).toContain('EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG');
    expect(deliveryIndex).toContain(
      "import { EBSR_MULTIPLE_CHOICE_TAG } from '../private-tags.js';"
    );
    expect(deliveryIndex).toContain('const MC_TAG_NAME = EBSR_MULTIPLE_CHOICE_TAG;');
    expect(authorIndex).toContain(
      "import { EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG } from '../private-tags.js';"
    );
    expect(authorIndex).toContain('multipleChoiceTagName: MC_TAG_NAME');
    expect(authorMain).toContain(
      "import { EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG } from '../private-tags.js';"
    );
    expect(authorMain).toContain('multipleChoiceTagName = EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG');
    expect(authorMain).toContain('<MultipleChoiceConfigureElement');
    expect(authorMain).not.toContain('<ebsr-multiple-choice-configure');
    expect(viteConfig).toContain('__PIE_PACKAGE_VERSION__');
    expect(iifeConfig).toContain('__PIE_PACKAGE_VERSION__');
  });

  it('regenerates complex-rubric version-scoped private child element wiring after upstream sync', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-react-complex-rubric-sync-test-'));
    const pieElementsDir = join(rootDir, 'upstream', 'pie-elements');
    const upstreamElementDir = join(pieElementsDir, 'packages', 'complex-rubric');

    await mkdir(join(upstreamElementDir, 'src'), { recursive: true });
    await mkdir(join(upstreamElementDir, 'configure', 'src'), { recursive: true });
    await writeFile(
      join(upstreamElementDir, 'src', 'index.js'),
      `import Rubric from '@pie-element/rubric';
import MultiTraitRubric from '@pie-element/multi-trait-rubric';
import { RUBRIC_TYPES } from '@pie-lib/rubric';
const RUBRIC_TAG_NAME = 'complex-rubric-simple';
const MULTI_TRAIT_RUBRIC_TAG_NAME = 'complex-rubric-multi-trait';
customElements.define(RUBRIC_TAG_NAME, Rubric);
customElements.define(MULTI_TRAIT_RUBRIC_TAG_NAME, MultiTraitRubric);
export default class ComplexRubric extends HTMLElement {}
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'src', 'print.js'),
      `import Rubric from '@pie-element/rubric';
import MultiTraitRubric from '@pie-element/multi-trait-rubric';
import { RUBRIC_TYPES } from '@pie-lib/rubric';
const RUBRIC_TAG_NAME = 'complex-rubric-simple';
const MULTI_TRAIT_RUBRIC_TAG_NAME = 'complex-rubric-multi-trait';
customElements.define(RUBRIC_TAG_NAME, Rubric);
customElements.define(MULTI_TRAIT_RUBRIC_TAG_NAME, MultiTraitRubric);
export default class ComplexRubricPrint extends HTMLElement {}
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'configure', 'src', 'index.js'),
      `import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './main';
import sensibleDefaults from './defaults';
const RUBRIC_TAG_NAME = 'rubric-configure';
const MULTI_TRAIT_RUBRIC_TAG_NAME = 'multi-trait-rubric-configure';
export default class ComplexRubricConfigureElement extends HTMLElement {
  _render() {
    let element = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
      canUpdateModel: this.canUpdateModel
    });
    createRoot(this).render(element);
  }
}
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'configure', 'src', 'main.jsx'),
      `import React from 'react';
import PropTypes from 'prop-types';
import { RUBRIC_TYPES } from '@pie-lib/rubric';
import { color } from '@pie-lib/render-ui';
export class Main extends React.Component {
  static propTypes = {
    canUpdateModel: PropTypes.bool,
    configuration: PropTypes.object,
    model: PropTypes.object,
    onModelChanged: PropTypes.func,
    onConfigurationChanged: PropTypes.func,
  };
  render() {
    const { model, configuration, canUpdateModel } = this.props;
    return canUpdateModel ? (
      <div>
        <rubric-configure id="simpleRubric" />
        <multi-trait-rubric-configure id="multiTraitRubric" />
      </div>
    ) : null;
  }
}
export default Main;
`,
      'utf-8'
    );
    await writeFile(
      join(upstreamElementDir, 'configure', 'src', 'defaults.js'),
      'export default {};\n'
    );
    await writeFile(
      join(upstreamElementDir, 'package.json'),
      JSON.stringify({ name: '@pie-element/complex-rubric', version: '1.2.3' }, null, 2),
      'utf-8'
    );
    await commitPieElementsFixture(pieElementsDir);

    const strategy = new ReactComponentsStrategy();
    await strategy.execute({
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
      packageFilter: 'complex-rubric',
    });

    const targetDir = join(rootDir, 'packages', 'elements-react', 'complex-rubric');
    const privateTags = await readFile(join(targetDir, 'src', 'private-tags.ts'), 'utf-8');
    const deliveryIndex = await readFile(join(targetDir, 'src', 'delivery', 'index.ts'), 'utf-8');
    const authorIndex = await readFile(join(targetDir, 'src', 'author', 'index.ts'), 'utf-8');
    const authorMain = await readFile(join(targetDir, 'src', 'author', 'main.tsx'), 'utf-8');

    expect(privateTags).toContain('COMPLEX_RUBRIC_SIMPLE_TAG');
    expect(privateTags).toContain('COMPLEX_RUBRIC_MULTI_TRAIT_CONFIGURE_TAG');
    expect(deliveryIndex).toContain('const RUBRIC_TAG_NAME = COMPLEX_RUBRIC_SIMPLE_TAG;');
    expect(deliveryIndex).toContain(
      'const MULTI_TRAIT_RUBRIC_TAG_NAME = COMPLEX_RUBRIC_MULTI_TRAIT_TAG;'
    );
    expect(authorIndex).toContain('COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG');
    expect(authorIndex).toContain('multiTraitRubricTagName: MULTI_TRAIT_RUBRIC_TAG_NAME');
    expect(authorIndex).toContain('simpleRubricTagName: RUBRIC_TAG_NAME');
    expect(authorMain).toContain('COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG');
    expect(authorMain).toContain('simpleRubricTagName = COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG');
    expect(authorMain).toContain('<SimpleRubricConfigureElement');
    expect(authorMain).toContain('<MultiTraitRubricConfigureElement');
    expect(authorMain).not.toContain('<rubric-configure');
    expect(authorMain).not.toContain('<multi-trait-rubric-configure');
  });
});
