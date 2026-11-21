import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

export interface DemoServerLock {
  pid: number;
  port?: number;
}

function readLock(lockFilePath: string): DemoServerLock | undefined {
  try {
    const lock = JSON.parse(readFileSync(lockFilePath, 'utf-8'));
    return typeof lock?.pid === 'number' ? lock : undefined;
  } catch {
    return undefined;
  }
}

function removeLock(lockFilePath: string): void {
  try {
    unlinkSync(lockFilePath);
  } catch {
    // Already gone, or not ours to remove.
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process exists but belongs to another user.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * Takes the lock for this process. Returns the live holder instead when another process has it;
 * a lock that is unreadable or names a dead process is replaced.
 */
export function claimDemoServerLock(
  lockFilePath: string,
  port: number
): DemoServerLock | undefined {
  if (existsSync(lockFilePath)) {
    const holder = readLock(lockFilePath);
    if (holder && holder.pid !== process.pid && isProcessRunning(holder.pid)) return holder;
    removeLock(lockFilePath);
  }
  const lock = { pid: process.pid, port, startedAt: new Date().toISOString() };
  writeFileSync(lockFilePath, `${JSON.stringify(lock, null, 2)}\n`);
  return undefined;
}

/** Removes the lock if this process holds it, or if it is unreadable. */
export function releaseDemoServerLock(lockFilePath: string): void {
  if (!existsSync(lockFilePath)) return;
  const holder = readLock(lockFilePath);
  if (holder && holder.pid !== process.pid) return;
  removeLock(lockFilePath);
}
