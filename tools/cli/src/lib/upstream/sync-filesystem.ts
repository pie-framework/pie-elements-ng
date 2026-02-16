/**
 * File system utilities for sync operations
 */
import { existsSync } from 'node:fs';
import { readdir as fsReaddir, rm as fsRm } from 'node:fs/promises';
import { join } from 'node:path';

export interface CleanOptions {
  dryRun?: boolean;
  verbose?: boolean;
  preserve?: string[];
}

export interface Logger {
  info(message: string): void;
}

/**
 * Clean a directory, optionally preserving subdirectories
 */
export async function cleanDirectory(
  targetDir: string,
  label: string,
  options: CleanOptions = {},
  logger?: Logger
): Promise<void> {
  const { dryRun = false, verbose = false, preserve = [] } = options;

  if (!existsSync(targetDir)) {
    return;
  }

  if (dryRun) {
    if (verbose && logger) {
      const preserveMsg = preserve.length > 0 ? ` (preserving: ${preserve.join(', ')})` : '';
      logger.info(`  🧹 Would clean ${label}${preserveMsg}`);
    }
    return;
  }

  // If no directories to preserve, delete everything
  if (preserve.length === 0) {
    await fsRm(targetDir, { recursive: true, force: true });
    if (verbose && logger) {
      logger.info(`  🧹 Cleaned ${label}`);
    }
    return;
  }

  // Selectively delete entries, preserving specified directories
  const entries = await fsReaddir(targetDir);

  for (const entry of entries) {
    if (preserve.includes(entry)) {
      continue;
    }

    const entryPath = join(targetDir, entry);
    await fsRm(entryPath, { recursive: true, force: true });
  }

  if (verbose && logger) {
    logger.info(`  🧹 Cleaned ${label} (preserved: ${preserve.join(', ')})`);
  }
}

/**
 * Check if any of the given paths exist
 */
export function existsAny(paths: string[]): boolean {
  return paths.some((p) => existsSync(p));
}

/**
 * Safe wrapper around readdir that sorts results
 */
export async function readdir(path: string): Promise<string[]> {
  try {
    const entries = await fsReaddir(path);
    return entries.sort();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
