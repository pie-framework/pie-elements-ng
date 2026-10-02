import { execFileSync } from 'node:child_process';
import { isolatedGitEnv } from '../../src/utils/git.js';

/** Runs git in `cwd` with the environment of a git hook stripped. */
export function gitIn(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    env: isolatedGitEnv(),
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

/** Makes `dir` a new repository whose first commit holds everything in it. */
export function commitFixtureRepo(dir: string): void {
  gitIn(dir, ['init']);
  gitIn(dir, ['add', '.']);
  gitIn(dir, [
    '-c',
    'user.name=Test User',
    '-c',
    'user.email=test@example.com',
    'commit',
    '-m',
    'init',
  ]);
}
