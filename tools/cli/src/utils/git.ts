import { execSync } from 'node:child_process';

/**
 * The environment for a git subprocess aimed at a repository through `cwd`.
 * A git hook exports `GIT_DIR`, which overrides `cwd`: from a worktree it is an
 * absolute path, so `git init` in a temp dir re-initialises the hooked
 * repository as bare and `rev-parse` reads the hooked repository's HEAD.
 */
export function isolatedGitEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(env).filter(([key]) => !key.startsWith('GIT_')));
}

function git(command: string, cwd: string): string {
  return execSync(`git ${command}`, { cwd, encoding: 'utf8', env: isolatedGitEnv() });
}

export function getCurrentCommit(cwd: string): string {
  try {
    return git('rev-parse HEAD', cwd).trim();
  } catch (error) {
    throw new Error(`Failed to get current commit: ${error}`);
  }
}

export function getCurrentCommitShort(cwd: string): string {
  try {
    return git('rev-parse --short HEAD', cwd).trim();
  } catch (error) {
    throw new Error(`Failed to get short commit: ${error}`);
  }
}

export function getCommitsSince(since: string, cwd: string): string[] {
  try {
    const output = git(`log ${since}..HEAD --oneline`, cwd).trim();

    if (!output) return [];
    return output.split('\n');
  } catch (error) {
    throw new Error(`Failed to get commits since ${since}: ${error}`);
  }
}

export function getFileModifiedDate(filePath: string, cwd: string): Date {
  try {
    const timestamp = git(`log -1 --format=%ct -- "${filePath}"`, cwd).trim();

    return new Date(Number.parseInt(timestamp, 10) * 1000);
  } catch (error) {
    throw new Error(`Failed to get file modification date: ${error}`);
  }
}

export function getCommitDetails(commit: string, cwd: string): string {
  try {
    return git(`show --stat ${commit}`, cwd);
  } catch (error) {
    throw new Error(`Failed to get commit details: ${error}`);
  }
}

export function getAuthorName(cwd: string): string {
  try {
    return git('config user.name', cwd).trim();
  } catch (_error) {
    return 'Unknown';
  }
}
