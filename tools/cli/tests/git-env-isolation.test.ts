/**
 * `bun run test` runs from the pre-push hook, which exports `GIT_DIR`. Pushing
 * from a worktree, a fixture's `git init` inherited that absolute path and set
 * `core.bare = true` in the real repository, breaking git in every checkout.
 */
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getCurrentCommit, isolatedGitEnv } from '../src/utils/git.js';
import { commitFixtureRepo, gitIn } from './helpers/git-fixture.js';

const inheritedGitDir = process.env.GIT_DIR;

afterEach(() => {
  if (inheritedGitDir === undefined) delete process.env.GIT_DIR;
  else process.env.GIT_DIR = inheritedGitDir;
});

describe('isolatedGitEnv', () => {
  it('drops every GIT_ variable and keeps the rest', () => {
    const env = {
      GIT_DIR: '/repo/.git/worktrees/wt',
      GIT_EXEC_PATH: '/git-core',
      GIT_PREFIX: '',
      HOME: '/home/test',
      PATH: '/bin',
    };

    expect(isolatedGitEnv(env)).toEqual({ HOME: '/home/test', PATH: '/bin' });
    expect(env.GIT_DIR).toBe('/repo/.git/worktrees/wt');
  });
});

describe('git subprocesses under a git hook', () => {
  it('act on the repository in cwd, not the one GIT_DIR names', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-git-env-test-'));
    const hookedRepo = join(rootDir, 'hooked');
    const fixtureRepo = join(rootDir, 'fixture');
    await mkdir(hookedRepo);
    await mkdir(fixtureRepo);
    await writeFile(join(fixtureRepo, 'file.txt'), 'fixture\n');
    gitIn(hookedRepo, ['init']);

    process.env.GIT_DIR = join(hookedRepo, '.git');
    commitFixtureRepo(fixtureRepo);
    const fixtureHead = gitIn(fixtureRepo, ['rev-parse', 'HEAD']).trim();

    expect(existsSync(join(fixtureRepo, '.git'))).toBe(true);
    expect(getCurrentCommit(fixtureRepo)).toBe(fixtureHead);
    expect(gitIn(hookedRepo, ['config', '--get', 'core.bare']).trim()).toBe('false');
  });
});
