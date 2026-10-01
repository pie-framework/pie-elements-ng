import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planPrChangeset, renderPrSummary } from '../scripts/release-record-pr-changeset.mjs';
import { collectPublishablePackages } from '../scripts/release-synthesize-changesets.mjs';

const SCRIPT = join(import.meta.dirname, '..', 'scripts', 'release-record-pr-changeset.mjs');
const MC = 'packages/elements-svelte/mc-populated-blank';
const CHOICE = 'packages/elements-react/multiple-choice';

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
};

const run = (cwd: string, command: string, args: string[]) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', env: GIT_ENV }).trim();

const write = async (rootDir: string, path: string, content: string) => {
  const target = join(rootDir, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
};

const commit = (rootDir: string, message: string) => {
  run(rootDir, 'git', ['add', '-A']);
  run(rootDir, 'git', ['commit', '-q', '-m', message]);
  return run(rootDir, 'git', ['rev-parse', 'HEAD']);
};

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `pie-release-record-${process.pid}-${Date.now()}-${Math.random()}`);
  await write(root, 'package.json', JSON.stringify({ name: 'root', workspaces: ['packages/*/*'] }));
  await write(root, '.changeset/config.json', JSON.stringify({ ignore: [] }));
  await write(root, '.changeset/README.md', '# Changesets\n');
  await write(
    root,
    `${MC}/package.json`,
    JSON.stringify({ name: '@pie-element/mc-populated-blank', version: '1.0.0' })
  );
  await write(
    root,
    `${CHOICE}/package.json`,
    JSON.stringify({ name: '@pie-element/multiple-choice', version: '13.4.0' })
  );
  run(root, 'git', ['init', '-q', '-b', 'develop']);
  return root;
}

const record = (rootDir: string, base: string, head: string, number: string, title: string) =>
  run(rootDir, process.execPath, [
    SCRIPT,
    '--base',
    base,
    '--head',
    head,
    '--number',
    number,
    '--title',
    title,
  ]);

describe('PR changeset planning', () => {
  it('leaves out the packages a changeset added by the PR already names', async () => {
    const rootDir = await makeRepo();

    expect(
      planPrChangeset({
        rootDir,
        changedFiles: [`${MC}/src/index.ts`, `${CHOICE}/src/index.ts`, 'docs/x.md'],
        authoredChangesets: ['---\n"@pie-element/multiple-choice": minor\n---\n\nAuthored\n'],
        packages: collectPublishablePackages(rootDir),
      })
    ).toEqual(['@pie-element/mc-populated-blank']);
  });

  it('carries the PR number where changelog-github reads it', () => {
    expect(renderPrSummary('fix(number-line): allow touch dragging (PIE-1104) ', 239)).toBe(
      'fix(number-line): allow touch dragging (PIE-1104)\n\npr: 239'
    );
  });
});

describe('recording a merged PR', () => {
  it('writes pr-<n>.md naming the packages the merge changed', async () => {
    const rootDir = await makeRepo();
    const base = commit(rootDir, 'initial');
    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    await write(rootDir, `${CHOICE}/src/index.test.ts`, 'it("x", () => {});\n');
    const head = commit(rootDir, 'Merge pull request #239');

    const output = record(rootDir, base, head, '239', 'fix(mc): a');

    expect(output).toContain('recorded=true');
    expect(readFileSync(join(rootDir, '.changeset', 'pr-239.md'), 'utf8')).toBe(
      '---\n  "@pie-element/mc-populated-blank": patch\n---\n\nfix(mc): a\n\npr: 239\n'
    );
  });

  it('writes nothing when the merge changed no shipping files', async () => {
    const rootDir = await makeRepo();
    const base = commit(rootDir, 'initial');
    await write(rootDir, 'docs/notes.md', 'notes\n');
    await write(rootDir, `${MC}/src/index.test.ts`, 'it("x", () => {});\n');
    const head = commit(rootDir, 'docs: notes');

    expect(record(rootDir, base, head, '240', 'docs: notes')).toContain('recorded=false');
    expect(existsSync(join(rootDir, '.changeset', 'pr-240.md'))).toBe(false);
  });

  it('writes nothing when the PR brought its own changeset for everything it changed', async () => {
    const rootDir = await makeRepo();
    const base = commit(rootDir, 'initial');
    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    await write(
      rootDir,
      '.changeset/authored.md',
      '---\n"@pie-element/mc-populated-blank": minor\n---\n\nAuthored\n'
    );
    const head = commit(rootDir, 'feat(mc): a');

    expect(record(rootDir, base, head, '241', 'feat(mc): a')).toContain('recorded=false');
    expect(existsSync(join(rootDir, '.changeset', 'pr-241.md'))).toBe(false);
  });

  // Editing a changeset, say to fix a typo, is not writing one: the PR's own change still needs
  // its entry.
  it('still records packages named by a changeset the PR only edited', async () => {
    const rootDir = await makeRepo();
    await write(
      rootDir,
      '.changeset/pr-200.md',
      '---\n"@pie-element/mc-populated-blank": patch\n---\n\nTpyo\n\npr: 200\n'
    );
    const base = commit(rootDir, 'initial');
    await write(
      rootDir,
      '.changeset/pr-200.md',
      '---\n"@pie-element/mc-populated-blank": patch\n---\n\nTypo\n\npr: 200\n'
    );
    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    const head = commit(rootDir, 'fix(mc): a, and a typo');

    expect(record(rootDir, base, head, '250', 'fix(mc): a')).toContain('recorded=true');
    expect(readFileSync(join(rootDir, '.changeset', 'pr-250.md'), 'utf8')).toContain(
      '"@pie-element/mc-populated-blank": patch'
    );
  });

  it('leaves an existing pr-<n>.md alone, so a re-run records nothing twice', async () => {
    const rootDir = await makeRepo();
    const base = commit(rootDir, 'initial');
    await write(rootDir, `${MC}/src/index.ts`, 'export const a = 1;\n');
    await write(rootDir, '.changeset/pr-242.md', 'edited by hand\n');
    const head = commit(rootDir, 'feat(mc): a');

    expect(record(rootDir, base, head, '242', 'feat(mc): a')).toContain('recorded=false');
    expect(readFileSync(join(rootDir, '.changeset', 'pr-242.md'), 'utf8')).toBe('edited by hand\n');
  });
});
