import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectPublishablePackages,
  collectUnreleasedFiles,
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

// `collectUnreleasedFiles` is the part PIE-1073 replaced: release intent used to be the range of
// one push, which a cancelled or failed run took to the grave. These exercise real git history,
// because the whole question is what git reports about commits that have been rebased,
// reordered, or never released.
describe('unreleased-file collection', () => {
  const MC = 'packages/elements-svelte/mc-populated-blank';
  const CHOICE = 'packages/elements-react/multiple-choice';

  const run = (rootDir: string, args: string[]) =>
    execFileSync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'test',
        GIT_AUTHOR_EMAIL: 'test@example.com',
        GIT_COMMITTER_NAME: 'test',
        GIT_COMMITTER_EMAIL: 'test@example.com',
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_SYSTEM: '/dev/null',
      },
    }).trim();

  async function makeGitFixture() {
    const rootDir = await makeRepoFixture(ELEMENTS);
    run(rootDir, ['init', '-q', '-b', 'develop']);
    return rootDir;
  }

  const write = async (rootDir: string, path: string, content: string) => {
    const target = join(rootDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  };

  const commit = (rootDir: string, message: string) => {
    run(rootDir, ['add', '-A']);
    run(rootDir, ['commit', '-q', '-m', message]);
    return run(rootDir, ['rev-parse', 'HEAD']);
  };

  const bumpVersion = async (rootDir: string, dir: string, name: string, version: string) => {
    await write(rootDir, `${dir}/package.json`, JSON.stringify({ name, version }));
  };

  const unreleased = (rootDir: string, head = 'HEAD') =>
    planSynthesizedChangeset({
      rootDir,
      changedFiles: collectUnreleasedFiles({
        rootDir,
        head,
        packages: collectPublishablePackages(rootDir),
      }),
    });

  it('treats a package whose code postdates its own version bump as unreleased', async () => {
    const rootDir = await makeGitFixture();
    commit(rootDir, 'initial');

    // Released: the version moved after the code landed.
    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    commit(rootDir, 'feat(mc): a');
    await bumpVersion(rootDir, MC, '@pie-element/mc-populated-blank', '1.0.1');
    commit(rootDir, 'chore(release): version packages (next)');

    expect(unreleased(rootDir)).toEqual([]);

    // Unreleased: code after the bump.
    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 2;\n');
    commit(rootDir, 'fix(mc): b');

    expect(unreleased(rootDir)).toEqual(['@pie-element/mc-populated-blank']);
  });

  // The regression the push-range baseline caused and a repo-wide "last release commit" baseline
  // would keep causing. The auto-release push rebases onto the branch tip when a merge lands
  // mid-run, so the bump commit ends up on top of code it never released. Measuring per package
  // is what keeps that code visible.
  it('still reports work the version bump was rebased on top of', async () => {
    const rootDir = await makeGitFixture();
    const base = commit(rootDir, 'initial');

    // Merge A, then the release run for A starts from A.
    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    const mergeA = commit(rootDir, 'feat(mc): a');

    // Merge B lands while that run is still building.
    await write(rootDir, `${CHOICE}/src/index.ts`, 'export const b = 1;\n');
    commit(rootDir, 'feat(choice): b');

    // The run's push is rejected, so it rebases its bump for A onto B and pushes that.
    run(rootDir, ['checkout', '-q', '-b', 'bump', mergeA]);
    await bumpVersion(rootDir, MC, '@pie-element/mc-populated-blank', '1.0.1');
    commit(rootDir, 'chore(release): version packages (next)');
    run(rootDir, ['rebase', '-q', 'develop']);
    run(rootDir, ['branch', '-qf', 'develop', 'HEAD']);
    run(rootDir, ['checkout', '-q', 'develop']);

    // The bump is now the tip, above B. A is released, B is not.
    expect(unreleased(rootDir)).toEqual(['@pie-element/multiple-choice']);
    expect(base).not.toEqual(mergeA);
  });

  // A run that dies takes its synthesized changeset with it. The next run has to pick the
  // packages up on its own, which is what makes the pipeline self-healing.
  it('reports packages from a release that never happened, however many merges ago', async () => {
    const rootDir = await makeGitFixture();
    commit(rootDir, 'initial');

    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    commit(rootDir, 'feat(mc): a');
    // Six more merges land; every release run for them is cancelled or fails.
    for (let i = 0; i < 6; i += 1) {
      await write(rootDir, 'docs.md', `docs ${i}\n`);
      commit(rootDir, `docs: ${i}`);
    }
    await write(rootDir, `${CHOICE}/src/index.ts`, 'export const b = 1;\n');
    commit(rootDir, 'feat(choice): b');

    expect(unreleased(rootDir)).toEqual([
      '@pie-element/mc-populated-blank',
      '@pie-element/multiple-choice',
    ]);
  });

  it('reports a package that has never been released from this repo', async () => {
    const rootDir = await makeRepoFixture({
      ...ELEMENTS,
      'packages/elements-svelte/brand-new': { name: '@pie-element/brand-new' },
    });
    run(rootDir, ['init', '-q', '-b', 'develop']);
    commit(rootDir, 'initial');

    // Its manifest arrived with a version, so the add commit is its release point, and only
    // code added after it counts.
    expect(unreleased(rootDir)).toEqual([]);

    await write(
      rootDir,
      'packages/elements-svelte/brand-new/src/index.ts',
      'export const a = 1;\n'
    );
    commit(rootDir, 'feat(brand-new): first code');

    expect(unreleased(rootDir)).toEqual(['@pie-element/brand-new']);
  });

  it('does not treat a dependency-only manifest edit as a release point', async () => {
    const rootDir = await makeGitFixture();
    commit(rootDir, 'initial');

    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    commit(rootDir, 'feat(mc): a');
    await write(
      rootDir,
      `${MC}/package.json`,
      JSON.stringify({
        name: '@pie-element/mc-populated-blank',
        version: '1.0.0',
        dependencies: { '@pie-lib/render-ui': '^6.0.1' },
      })
    );
    commit(rootDir, 'build(deps): bump render-ui');

    expect(unreleased(rootDir)).toEqual(['@pie-element/mc-populated-blank']);
  });

  it('ignores unreleased changes confined to non-shipping paths', async () => {
    const rootDir = await makeGitFixture();
    commit(rootDir, 'initial');

    await write(rootDir, `${MC}/src/index.test.ts`, 'it("x", () => {});\n');
    await write(rootDir, `${CHOICE}/src/__tests__/index.tsx`, 'export {};\n');
    commit(rootDir, 'test: add coverage');

    expect(unreleased(rootDir)).toEqual([]);
  });
});
