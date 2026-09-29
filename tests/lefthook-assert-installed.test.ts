import { execFile } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { chmod, copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { load } from 'js-yaml';
import { afterAll, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const REPO_ROOT = join(import.meta.dirname, '..');

// The native binary the installed lefthook's bin/index.js wrapper runs.
const LEFTHOOK_EXE: string = createRequire(import.meta.url)('lefthook/get-exe.js').getExePath();

// The setting as lefthook.yml configures it.
const { assert_lefthook_installed: ASSERT_INSTALLED = false } = load(
  readFileSync(join(REPO_ROOT, 'lefthook.yml'), 'utf8')
) as { assert_lefthook_installed?: boolean };

const tempDirs: string[] = [];
afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

const onPath = (name: string) => {
  const found = (process.env.PATH ?? '')
    .split(delimiter)
    .map((dir) => join(dir, name))
    .find((candidate) => existsSync(candidate));
  if (!found) throw new Error(`${name} is not on PATH`);
  return found;
};

// A checkout whose own `bun install` generated its hooks, pushing after `bun run clean` removed
// node_modules: the hook finds lefthook neither on PATH, nor at the path it baked in, nor under
// node_modules. The gate passes, so only the hook's own lookup can reject the push.
//
// Git and lefthook get no GIT_* or LEFTHOOK* variable from the caller: git exports GIT_DIR to a
// hook run from a linked worktree, so inside the pre-push gate every git call here would reach
// the outer repository, and a LEFTHOOK_BIN would bypass the lookup under test. PATH is the system
// directories plus git, because `bun run` adds node_modules/.bin, whose lefthook would answer the
// hook's `lefthook -h` probe.
it('rejects a push when the hook finds no lefthook', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pie-lefthook-assert-'));
  tempDirs.push(dir);
  const main = join(dir, 'main');
  const remote = join(dir, 'remote.git');
  const bin = join(dir, 'bin');
  await mkdir(bin);
  await symlink(onPath('git'), join(bin, 'git'));
  const gitConfig = join(dir, 'gitconfig');
  await writeFile(
    gitConfig,
    '[user]\n\tname = test\n\temail = test@example.com\n[commit]\n\tgpgsign = false\n[init]\n\tdefaultBranch = develop\n'
  );
  const env = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([name]) => !name.startsWith('GIT_') && !name.startsWith('LEFTHOOK')
      )
    ),
    GIT_CONFIG_GLOBAL: gitConfig,
    GIT_CONFIG_NOSYSTEM: '1',
    PATH: [bin, '/usr/bin', '/bin'].join(delimiter),
  };

  const exec = async (cwd: string, command: string, ...args: string[]) => {
    try {
      const { stdout, stderr } = await execFileAsync(command, args, { cwd, env, encoding: 'utf8' });
      return { ok: true, output: `${stdout}${stderr}` };
    } catch (error) {
      const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };
      return { ok: false, output: `${stdout}${stderr}` };
    }
  };
  const git = async (cwd: string, ...args: string[]) => {
    const { ok, output } = await exec(cwd, 'git', ...args);
    if (!ok) throw new Error(`git ${args.join(' ')} failed: ${output}`);
  };

  await git(dir, 'init', '--quiet', '--bare', remote);
  await git(dir, 'init', '--quiet', main);
  await writeFile(
    join(main, 'lefthook.yml'),
    `assert_lefthook_installed: ${ASSERT_INSTALLED}
pre-push:
  commands:
    gate:
      run: "true"
`
  );
  await git(main, 'add', 'lefthook.yml');
  await git(main, 'commit', '--no-verify', '--quiet', '--message', 'init');
  await git(main, 'remote', 'add', 'origin', remote);
  await git(main, 'push', '--quiet', '--no-verify', '--set-upstream', 'origin', 'develop');

  // `bun install`, whose postinstall bakes the path of this checkout's lefthook into the hooks.
  // Copied, because on Linux lefthook bakes in the resolved path of a symlink.
  const installedExe = join(main, 'node_modules', 'lefthook-bin', 'lefthook');
  await mkdir(dirname(installedExe), { recursive: true });
  await copyFile(LEFTHOOK_EXE, installedExe);
  await chmod(installedExe, 0o755);
  const install = await exec(main, installedExe, 'install');
  if (!install.ok) throw new Error(`lefthook install failed: ${install.output}`);
  // `bun run clean`.
  await rm(join(main, 'node_modules'), { recursive: true, force: true });

  await git(main, 'switch', '--quiet', '--create', 'topic');
  await writeFile(join(main, 'change.txt'), 'change\n');
  await git(main, 'add', 'change.txt');
  await git(main, 'commit', '--no-verify', '--quiet', '--message', 'change');
  const push = await exec(main, 'git', 'push', '--set-upstream', 'origin', 'topic');

  expect(push.output).toContain('Operation is aborted due to lefthook settings');
  expect(push.ok).toBe(false);
  expect((await exec(remote, 'git', 'rev-parse', '--verify', 'topic')).ok).toBe(false);
}, 30_000);
