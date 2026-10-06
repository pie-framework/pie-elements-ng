import { describe, expect, it } from 'vitest';
import {
  ciScope,
  classifyPush,
  isDocumentationOnly,
  isDocumentationPath,
} from '../scripts/lib/change-scope.mjs';

const LOCAL = 'a5b6846b65be6ccc6cb95bd8f9776a350522ab01';
const REMOTE = '3ac26b3400000000000000000000000000000000';
const ZERO_SHA = '0'.repeat(40);
const CODE = 'packages/elements-svelte/multiple-choice/src/index.ts';

/** A pre-push stdin line: `<local ref> <local sha> <remote ref> <remote sha>`. */
const line = ({ ref = 'refs/heads/develop', localSha = LOCAL, remoteSha = REMOTE } = {}) =>
  `${ref} ${localSha} ${ref} ${remoteSha}\n`;

const adding =
  (commits: number, ...paths: string[]) =>
  () => ({ commits, paths });

describe('isDocumentationPath', () => {
  it.each([
    'AGENTS.md',
    'README.md',
    'docs/MATH-RENDERING.md',
    'docs/a11y/INDEX.md',
    'docs/evals/elements-react/categorize/evals.yaml',
    'docs/img/build-process-1-1769798201992.jpg',
    '.claude/skills/pie-element-author/SKILL.md',
    '.agents/skills/pie-element-author/SKILL.md',
  ])('%s is documentation', (path) => {
    expect(isDocumentationPath(path)).toBe(true);
  });

  it.each([
    // tools/cli/tests/element-contracts.test.ts reads it.
    'docs/PIE_ELEMENT_CONTRACT.md',
    // The element docs build reads package READMEs.
    'packages/elements-svelte/multiple-choice/README.md',
    '.changeset/pr-370.md',
    'packages/elements-react/categorize/docs/demo/config.mjs',
    'tools/cli/src/lib/docs/generator.ts',
    'package.json',
    '.github/workflows/ci.yml',
  ])('%s is code', (path) => {
    expect(isDocumentationPath(path)).toBe(false);
  });
});

describe('isDocumentationOnly', () => {
  it('needs every path to be documentation, and at least one', () => {
    expect(isDocumentationOnly(['AGENTS.md', 'docs/a11y/INDEX.md'])).toBe(true);
    expect(isDocumentationOnly(['AGENTS.md', 'bun.lock'])).toBe(false);
    expect(isDocumentationOnly([])).toBe(false);
  });
});

describe('ciScope', () => {
  it('runs everything for a code change', () => {
    expect(ciScope({ skipHeavy: false, changedPaths: [CODE] })).toEqual({
      skipCode: false,
      skipLint: false,
    });
  });

  it('runs only lint for a documentation-only change', () => {
    expect(ciScope({ skipHeavy: false, changedPaths: ['docs/MATH-RENDERING.md'] })).toEqual({
      skipCode: true,
      skipLint: false,
    });
  });

  it('skips everything for a release pull request', () => {
    expect(ciScope({ skipHeavy: true, changedPaths: [CODE] })).toEqual({
      skipCode: true,
      skipLint: true,
    });
  });

  it('runs everything when the paths could not be listed', () => {
    expect(ciScope({ skipHeavy: false, changedPaths: null })).toEqual({
      skipCode: false,
      skipLint: false,
    });
  });
});

describe('classifyPush', () => {
  it('skips a push whose new commits change documentation only', () => {
    const result = classifyPush({
      stdin: line(),
      listNewCommits: adding(2, 'docs/MATH-RENDERING.md', 'AGENTS.md'),
    });
    expect(result.verdict).toBe('skip');
    expect(result.reason).toContain('documentation only');
  });

  it('runs when any ref brings code', () => {
    const added = [
      { commits: 1, paths: ['docs/a11y/INDEX.md'] },
      { commits: 1, paths: [CODE] },
    ];
    const result = classifyPush({
      stdin: line({ ref: 'refs/heads/a' }) + line({ ref: 'refs/heads/b', remoteSha: ZERO_SHA }),
      listNewCommits: () => added.shift() ?? null,
    });
    expect(result.verdict).toBe('run');
  });

  it('skips a push that adds no commits, e.g. a branch at a pushed commit', () => {
    const result = classifyPush({
      stdin: line({ ref: 'refs/heads/topic', remoteSha: ZERO_SHA }),
      listNewCommits: adding(0),
    });
    expect(result.verdict).toBe('skip');
  });

  it('skips a deletion without consulting git', () => {
    const result = classifyPush({
      stdin: `(delete) ${ZERO_SHA} refs/heads/topic ${REMOTE}\n`,
      listNewCommits: () => {
        throw new Error('consulted git');
      },
    });
    expect(result.verdict).toBe('skip');
  });

  it('runs for an empty commit, which lists no paths', () => {
    const result = classifyPush({ stdin: line(), listNewCommits: adding(1) });
    expect(result.verdict).toBe('run');
  });

  it.each([
    ['empty stdin', '', adding(0)],
    ['unreadable stdin', null, adding(0)],
    ['a malformed line', `refs/heads/topic ${LOCAL}\n`, adding(0)],
    ['a ref git could not list', line(), () => null],
    ['a nonsensical count', line(), () => ({ commits: Number.NaN, paths: ['AGENTS.md'] })],
  ])('runs on %s', (_case, stdin, listNewCommits) => {
    expect(classifyPush({ stdin, listNewCommits }).verdict).toBe('run');
  });
});
