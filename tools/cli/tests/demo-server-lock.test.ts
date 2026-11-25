// @vitest-environment node
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { claimDemoServerLock, releaseDemoServerLock } from '../src/utils/demo-server-lock.js';

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

function lockPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pie-demo-lock-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, '.demo-server.5222.lock');
}

function liveProcess(): ChildProcess {
  const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60_000)'], {
    stdio: 'ignore',
  });
  cleanups.push(() => child.kill());
  return child;
}

const readPid = (path: string) => JSON.parse(readFileSync(path, 'utf-8')).pid;

describe('demo server lock', () => {
  it('returns the live holder and leaves its lock in place', () => {
    const path = lockPath();
    const holder = liveProcess();
    writeFileSync(path, JSON.stringify({ pid: holder.pid, port: 5222 }));

    expect(claimDemoServerLock(path, 5222)).toEqual({ pid: holder.pid, port: 5222 });
    expect(readPid(path)).toBe(holder.pid);

    releaseDemoServerLock(path);
    expect(readPid(path)).toBe(holder.pid);
  });

  it('replaces a lock whose process has exited', () => {
    const path = lockPath();
    const { pid } = spawnSync(process.execPath, ['-e', '']);
    writeFileSync(path, JSON.stringify({ pid, port: 5222 }));

    expect(claimDemoServerLock(path, 5222)).toBeUndefined();
    expect(readPid(path)).toBe(process.pid);
  });

  it('replaces an unreadable lock', () => {
    const path = lockPath();
    writeFileSync(path, 'not json');

    expect(claimDemoServerLock(path, 5222)).toBeUndefined();
    expect(readPid(path)).toBe(process.pid);
  });

  it('releases only its own lock', () => {
    const path = lockPath();
    claimDemoServerLock(path, 5222);
    releaseDemoServerLock(path);
    expect(existsSync(path)).toBe(false);
  });
});
