import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  fetchTakenVersions,
  nextFreePrerelease,
  skipTakenPrereleases,
} from '../scripts/skip-taken-prereleases.mjs';

describe('nextFreePrerelease', () => {
  it('keeps a free version', () => {
    expect(nextFreePrerelease('12.1.1-next.30', new Set(['12.1.1-next.29']))).toBeNull();
  });

  it('moves a taken prerelease to the lowest free number above it', () => {
    const taken = new Set([
      '12.1.1-next.29',
      '12.1.1-next.30',
      '12.1.1-next.39',
      '12.1.1-next.178',
    ]);
    expect(nextFreePrerelease('12.1.1-next.29', taken)).toBe('12.1.1-next.31');
  });

  it('leaves a taken stable version to the availability check', () => {
    expect(nextFreePrerelease('12.2.4', new Set(['12.2.4']))).toBeNull();
  });
});

describe('fetchTakenVersions', () => {
  const respond = (status: number, body: unknown = {}) =>
    (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

  it('counts unpublished versions, which npm will not publish again', async () => {
    const taken = await fetchTakenVersions('@pie-element/a', {
      registry: 'https://registry.test',
      fetchImpl: respond(200, {
        versions: { '1.0.0-next.1': {} },
        time: { created: '', modified: '', '1.0.0-next.1': '', '1.0.0-next.2': '' },
      }),
    });
    expect([...taken].sort()).toEqual(['1.0.0-next.1', '1.0.0-next.2']);
  });

  it('treats a package npm has never seen as holding nothing', async () => {
    const taken = await fetchTakenVersions('@pie-element/a', { fetchImpl: respond(404) });
    expect(taken.size).toBe(0);
  });

  it('fails when the registry cannot answer', async () => {
    await expect(fetchTakenVersions('@pie-element/a', { fetchImpl: respond(503) })).rejects.toThrow(
      '503'
    );
  });
});

// These run real git, because which versions changesets moved is what git reports against HEAD.
describe('skipTakenPrereleases', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  // A git hook exports GIT_DIR, absolute in a linked worktree, which would point these commands at
  // the repository running the tests instead of the fixture.
  const gitEnv = () => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
    };
    for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) {
      delete env[key];
    }
    return env;
  };

  const git = (root: string) => (args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', env: gitEnv() });

  const write = async (root: string, path: string, content: unknown) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    const text = typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`;
    await writeFile(join(root, path), text, 'utf8');
  };

  const read = (root: string, path: string) => readFile(join(root, path), 'utf8');

  // What `changeset version` leaves behind: `a` bumped onto a number the legacy lineage took, `b`
  // and `c` bumped as its dependents, and `d` unchanged although its own version is taken.
  async function makeVersionedFixture() {
    const root = await mkdtemp(join(tmpdir(), 'pie-skip-taken-'));
    roots.push(root);
    git(root)(['init', '-q', '-b', 'develop']);
    await write(root, 'package.json', { name: 'root', private: true });
    await write(root, 'packages/a/package.json', { name: 'a', version: '12.1.1-next.28' });
    await write(root, 'packages/a/CHANGELOG.md', '# a\n\n## 12.1.1-next.28\n');
    await write(root, 'packages/b/package.json', {
      name: 'b',
      version: '1.0.0-next.3',
      dependencies: { a: 'workspace:*' },
    });
    await write(root, 'packages/c/package.json', {
      name: 'c',
      version: '2.0.1-next.0',
      dependencies: { a: '^12.1.1-next.28' },
    });
    await write(root, 'packages/d/package.json', { name: 'd', version: '3.0.0-next.5' });
    await write(root, 'apps/demo/package.json', {
      name: 'demo',
      version: '0.1.0-next.1',
      private: true,
    });
    git(root)(['add', '-A']);
    git(root)(['commit', '-q', '-m', 'release']);

    await write(root, 'packages/a/package.json', { name: 'a', version: '12.1.1-next.29' });
    await write(
      root,
      'packages/a/CHANGELOG.md',
      '# a\n\n## 12.1.1-next.29\n\n### Patch Changes\n\n- Fix\n\n## 12.1.1-next.28\n'
    );
    await write(root, 'packages/b/package.json', {
      name: 'b',
      version: '1.0.0-next.4',
      dependencies: { a: 'workspace:*' },
    });
    await write(
      root,
      'packages/b/CHANGELOG.md',
      '# b\n\n## 1.0.0-next.4\n\n### Patch Changes\n\n- Updated dependencies\n  - a@12.1.1-next.29\n'
    );
    await write(root, 'packages/c/package.json', {
      name: 'c',
      version: '2.0.1-next.1',
      dependencies: { a: '^12.1.1-next.29' },
    });
    await write(root, 'apps/demo/package.json', {
      name: 'demo',
      version: '0.1.0-next.2',
      private: true,
    });
    return root;
  }

  const TAKEN: Record<string, string[]> = {
    a: ['12.1.1-next.28', '12.1.1-next.29', '12.1.1-next.39'],
    d: ['3.0.0-next.5'],
    demo: ['0.1.0-next.2'],
  };

  const run = (root: string, looked: string[] = []) =>
    skipTakenPrereleases({
      root,
      git: git(root),
      takenVersions: async (name: string) => {
        looked.push(name);
        return new Set(TAKEN[name] ?? []);
      },
    });

  it('moves a taken bump and every reference changesets wrote to it', async () => {
    const root = await makeVersionedFixture();

    const moves = await run(root);

    expect(moves).toEqual([
      { name: 'a', path: 'packages/a/package.json', from: '12.1.1-next.29', to: '12.1.1-next.30' },
    ]);
    expect(await read(root, 'packages/a/package.json')).toBe(
      `${JSON.stringify({ name: 'a', version: '12.1.1-next.30' }, null, 2)}\n`
    );
    expect(await read(root, 'packages/a/CHANGELOG.md')).toBe(
      '# a\n\n## 12.1.1-next.30\n\n### Patch Changes\n\n- Fix\n\n## 12.1.1-next.28\n'
    );
    expect(await read(root, 'packages/b/CHANGELOG.md')).toContain('  - a@12.1.1-next.30\n');
    expect(JSON.parse(await read(root, 'packages/b/package.json')).dependencies.a).toBe(
      'workspace:*'
    );
    expect(JSON.parse(await read(root, 'packages/c/package.json')).dependencies.a).toBe(
      '^12.1.1-next.30'
    );
  });

  it('asks the registry only about public packages that changesets bumped', async () => {
    const root = await makeVersionedFixture();
    const looked: string[] = [];

    await run(root, looked);

    expect(looked.sort()).toEqual(['a', 'b', 'c']);
    expect(JSON.parse(await read(root, 'packages/d/package.json')).version).toBe('3.0.0-next.5');
    expect(JSON.parse(await read(root, 'apps/demo/package.json')).version).toBe('0.1.0-next.2');
  });

  it('changes nothing when every bump is free', async () => {
    const root = await makeVersionedFixture();
    const before = await read(root, 'packages/b/CHANGELOG.md');

    const moves = await skipTakenPrereleases({
      root,
      git: git(root),
      takenVersions: async () => new Set(),
    });

    expect(moves).toEqual([]);
    expect(JSON.parse(await read(root, 'packages/a/package.json')).version).toBe('12.1.1-next.29');
    expect(await read(root, 'packages/b/CHANGELOG.md')).toBe(before);
  });

  it('fails without writing when the registry cannot answer', async () => {
    const root = await makeVersionedFixture();

    await expect(
      skipTakenPrereleases({
        root,
        git: git(root),
        takenVersions: async () => {
          throw new Error('registry lookup for a failed with 503');
        },
      })
    ).rejects.toThrow('503');
    expect(JSON.parse(await read(root, 'packages/a/package.json')).version).toBe('12.1.1-next.29');
  });
});
