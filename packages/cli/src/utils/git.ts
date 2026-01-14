import { execSync } from 'node:child_process';

export function getCurrentCommit(cwd: string): string {
  try {
    return execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim();
  } catch (error) {
    throw new Error(`Failed to get current commit: ${error}`);
  }
}

export function getCurrentCommitShort(cwd: string): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf8' }).trim();
  } catch (error) {
    throw new Error(`Failed to get short commit: ${error}`);
  }
}

export function getCommitsSince(since: string, cwd: string): string[] {
  try {
    const output = execSync(`git log ${since}..HEAD --oneline`, {
      cwd,
      encoding: 'utf8',
    }).trim();

    if (!output) return [];
    return output.split('\n');
  } catch (error) {
    throw new Error(`Failed to get commits since ${since}: ${error}`);
  }
}

export function getFileModifiedDate(filePath: string, cwd: string): Date {
  try {
    const timestamp = execSync(`git log -1 --format=%ct -- "${filePath}"`, {
      cwd,
      encoding: 'utf8',
    }).trim();

    return new Date(Number.parseInt(timestamp, 10) * 1000);
  } catch (error) {
    throw new Error(`Failed to get file modification date: ${error}`);
  }
}

export function getCommitDetails(commit: string, cwd: string): string {
  try {
    return execSync(`git show --stat ${commit}`, {
      cwd,
      encoding: 'utf8',
    });
  } catch (error) {
    throw new Error(`Failed to get commit details: ${error}`);
  }
}

export function getAuthorName(cwd: string): string {
  try {
    return execSync('git config user.name', { cwd, encoding: 'utf8' }).trim();
  } catch (_error) {
    return 'Unknown';
  }
}
