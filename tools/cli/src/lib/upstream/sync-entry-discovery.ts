import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type EntryDefinition = readonly [entryName: string, sourceBasePath: string];

const DEFAULT_ENTRY_EXTENSIONS = ['.tsx', '.ts'] as const;

export function detectEntryFile(
  packageDir: string,
  sourceBasePath: string,
  extensions: readonly string[] = DEFAULT_ENTRY_EXTENSIONS
): string | null {
  for (const extension of extensions) {
    const entryPath = `${sourceBasePath}${extension}`;
    if (existsSync(join(packageDir, entryPath))) {
      return entryPath;
    }
  }
  return null;
}

export function collectEntryPoints(
  packageDir: string,
  entries: readonly EntryDefinition[],
  extensions: readonly string[] = DEFAULT_ENTRY_EXTENSIONS
): Record<string, string> {
  const entryPoints: Record<string, string> = {};

  for (const [entryName, sourceBasePath] of entries) {
    const entry = detectEntryFile(packageDir, sourceBasePath, extensions);
    if (entry) {
      entryPoints[entryName] = entry;
    }
  }

  return entryPoints;
}
