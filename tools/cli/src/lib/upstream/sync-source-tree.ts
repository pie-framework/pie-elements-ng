import { existsSync } from 'node:fs';
import { mkdir, readFile, stat as fsStat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { convertJsToTs, convertJsxToTsx } from '../../utils/conversion.js';
import { containsJsx, fixImportsInFile } from './sync-imports.js';
import { readdir } from './sync-filesystem.js';

export interface SyncSourceTreeStats {
  filesChecked: number;
  filesCopied: number;
  filesProcessed: number;
  filesSkipped: number;
  filesUpdated: number;
}

export interface SyncSourceTransformContext {
  absoluteSourcePath: string;
  relativeFilePath: string;
  upstreamSourcePath: string;
}

export interface SyncSourceTreeOptions {
  sourceDir: string;
  targetDir: string;
  relativePath: string;
  sourcePathPrefix: string;
  upstreamCommit: string;
  transform: (content: string, context: SyncSourceTransformContext) => string;
  skipFile?: (fileName: string, context: SyncSourceTransformContext) => boolean;
}

export async function syncSourceTree(options: SyncSourceTreeOptions): Promise<SyncSourceTreeStats> {
  const stats: SyncSourceTreeStats = {
    filesChecked: 0,
    filesCopied: 0,
    filesProcessed: 0,
    filesSkipped: 0,
    filesUpdated: 0,
  };
  const defaultExportFiles = new Set<string>();
  const items = await readdir(options.sourceDir);

  for (const item of items) {
    const srcPath = join(options.sourceDir, item);
    const stat = await fsStat(srcPath);

    if (stat.isDirectory()) {
      if (item.startsWith('__')) {
        continue;
      }

      const subStats = await syncSourceTree({
        ...options,
        sourceDir: srcPath,
        targetDir: join(options.targetDir, item),
        relativePath: join(options.relativePath, item),
      });
      addStats(stats, subStats);
      continue;
    }

    if (!item.endsWith('.js') && !item.endsWith('.jsx')) {
      continue;
    }

    const relativeFilePath = join(options.relativePath, item);
    const context: SyncSourceTransformContext = {
      absoluteSourcePath: srcPath,
      relativeFilePath,
      upstreamSourcePath: `${options.sourcePathPrefix}/${relativeFilePath}`,
    };

    if (options.skipFile?.(item, context)) {
      continue;
    }

    stats.filesChecked++;
    stats.filesProcessed++;

    let sourceContent = await readFile(srcPath, 'utf-8');
    sourceContent = options.transform(sourceContent, context);

    const hasJsx = item.endsWith('.jsx') || (item.endsWith('.js') && containsJsx(sourceContent));
    const targetFile = item.replace(/\.jsx?$/, hasJsx ? '.tsx' : '.ts');
    const targetPath = join(options.targetDir, targetFile);
    const conversionResult = hasJsx
      ? convertJsxToTsx(sourceContent, {
          sourcePath: context.upstreamSourcePath,
          commit: options.upstreamCommit,
        })
      : convertJsToTs(sourceContent, {
          sourcePath: context.upstreamSourcePath,
          commit: options.upstreamCommit,
        });
    const converted = conversionResult.code;

    if (conversionResult.hasDefaultObjectExport) {
      defaultExportFiles.add(targetFile.replace(/\.(ts|tsx)$/, ''));
    }

    const isNew = !existsSync(targetPath);
    if (!isNew) {
      const currentContent = await readFile(targetPath, 'utf-8');
      if (currentContent === converted) {
        stats.filesSkipped++;
        continue;
      }
      stats.filesUpdated++;
    } else {
      stats.filesCopied++;
    }

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, converted, 'utf-8');
  }

  if (defaultExportFiles.size > 0) {
    const targetDirItems = await readdir(options.targetDir);
    for (const item of targetDirItems) {
      const itemPath = join(options.targetDir, item);
      const stat = await fsStat(itemPath);
      if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        await fixImportsInFile(itemPath, defaultExportFiles);
      }
    }
  }

  return stats;
}

function addStats(target: SyncSourceTreeStats, source: SyncSourceTreeStats): void {
  target.filesChecked += source.filesChecked;
  target.filesCopied += source.filesCopied;
  target.filesProcessed += source.filesProcessed;
  target.filesSkipped += source.filesSkipped;
  target.filesUpdated += source.filesUpdated;
}
