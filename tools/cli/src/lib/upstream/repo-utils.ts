import { existsSync } from 'node:fs';

type RepoSpec = {
  label: string;
  path: string;
  extraMessage?: string;
};

export const formatRepoNotFound = (label: string, path: string, extraMessage?: string): string =>
  `${label} not found at ${path}${extraMessage ? `\n${extraMessage}` : ''}`;

export const assertReposExist = (repos: RepoSpec[]): void => {
  for (const repo of repos) {
    if (!existsSync(repo.path)) {
      throw new Error(formatRepoNotFound(repo.label, repo.path, repo.extraMessage));
    }
  }
};
