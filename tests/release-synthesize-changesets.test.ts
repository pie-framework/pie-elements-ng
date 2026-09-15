import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  planSynthesizedChangeset,
  renderChangeset,
} from '../scripts/release-synthesize-changesets.mjs';

type Manifest = { name: string; version?: string; private?: boolean };

async function makeRepoFixture(manifests: Record<string, Manifest>): Promise<string> {
  const root = join(tmpdir(), `pie-release-synth-${process.pid}-${Date.now()}-${Math.random()}`);
  await mkdir(join(root, '.changeset'), { recursive: true });
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: 'root', workspaces: ['packages/*/*', 'apps/*'] }),
    'utf8'
  );
  await writeFile(
    join(root, '.changeset', 'config.json'),
    JSON.stringify({ ignore: ['esm-player-test'] }),
    'utf8'
  );

  for (const [dir, manifest] of Object.entries(manifests)) {
    await mkdir(join(root, dir), { recursive: true });
    await writeFile(
      join(root, dir, 'package.json'),
      JSON.stringify({ version: '1.0.0', ...manifest }),
      'utf8'
    );
  }

  return root;
}

const ELEMENTS = {
  'packages/elements-svelte/mc-populated-blank': { name: '@pie-element/mc-populated-blank' },
  'packages/elements-react/multiple-choice': { name: '@pie-element/multiple-choice' },
  'apps/learnosity-parity-demo': { name: '@pie-element/learnosity-parity-demo', private: true },
};

describe('changeset synthesis', () => {
  it('selects the package owning a changed shipping file', async () => {
    const rootDir = await makeRepoFixture(ELEMENTS);

    expect(
      planSynthesizedChangeset({
        rootDir,
        changedFiles: [
          'packages/elements-svelte/mc-populated-blank/src/delivery/ChoiceRow.svelte',
          'packages/elements-svelte/mc-populated-blank/README.md',
        ],
      })
    ).toEqual(['@pie-element/mc-populated-blank']);
  });

  it('ignores private packages and files owned by no package', async () => {
    const rootDir = await makeRepoFixture(ELEMENTS);

    expect(
      planSynthesizedChangeset({
        rootDir,
        changedFiles: [
          'apps/learnosity-parity-demo/src/lib/samples/mc-populated-blank.json',
          'docs/prds/some-prd.md',
          'turbo.json',
        ],
      })
    ).toEqual([]);
  });

  it('ignores changes confined to tests, specs and snapshots', async () => {
    const rootDir = await makeRepoFixture(ELEMENTS);

    expect(
      planSynthesizedChangeset({
        rootDir,
        changedFiles: [
          'packages/elements-svelte/mc-populated-blank/src/delivery/McPopulatedBlank.test.ts',
          'packages/elements-react/multiple-choice/src/__tests__/index.tsx',
          'packages/elements-react/multiple-choice/vitest.setup.ts',
          'packages/elements-svelte/mc-populated-blank/test/e2e/snapshots/a.png',
        ],
      })
    ).toEqual([]);
  });

  it('leaves packages a pending changeset already covers to the author', async () => {
    const rootDir = await makeRepoFixture(ELEMENTS);
    await writeFile(
      join(rootDir, '.changeset', 'authored.md'),
      '---\n  "@pie-element/mc-populated-blank": minor\n---\n\nAuthored summary\n',
      'utf8'
    );

    expect(
      planSynthesizedChangeset({
        rootDir,
        changedFiles: [
          'packages/elements-svelte/mc-populated-blank/src/delivery/ChoiceRow.svelte',
          'packages/elements-react/multiple-choice/src/index.tsx',
        ],
        pendingChangesets: ['authored'],
      })
    ).toEqual(['@pie-element/multiple-choice']);
  });

  it('renders frontmatter changesets can parse', () => {
    expect(renderChangeset(['@pie-element/a', '@pie-element/b'], 'A summary')).toBe(
      '---\n  "@pie-element/a": patch\n  "@pie-element/b": patch\n---\n\nA summary\n'
    );
  });
});
