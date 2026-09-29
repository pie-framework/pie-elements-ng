import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

const git = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

afterEach(() => {
  vi.unstubAllEnvs();
});

// Pushing from a linked worktree runs pre-push with `GIT_DIR` naming that worktree's git
// directory. A fixture's `git init` that inherited it set `core.bare = true` in the config every
// checkout of the real repository shares.
it('keeps a hook-exported GIT_DIR away from the repository it names', async () => {
  const hooked = await mkdtemp(join(tmpdir(), 'hooked-repo-'));
  git(hooked, ['init', '-q']);
  git(hooked, [
    '-c',
    'user.name=test',
    '-c',
    'user.email=test@example.com',
    'commit',
    '-q',
    '--allow-empty',
    '-m',
    'initial',
  ]);
  const linkedWorktree = `${hooked}-linked`;
  git(hooked, ['worktree', 'add', '-q', '--detach', linkedWorktree]);
  const config = await readFile(join(hooked, '.git', 'config'), 'utf8');

  vi.stubEnv('GIT_DIR', git(linkedWorktree, ['rev-parse', '--absolute-git-dir']));
  vi.resetModules();
  await import('../vitest.setup');

  git(await mkdtemp(join(tmpdir(), 'fixture-repo-')), ['init', '-q']);

  expect(await readFile(join(hooked, '.git', 'config'), 'utf8')).toBe(config);
});
