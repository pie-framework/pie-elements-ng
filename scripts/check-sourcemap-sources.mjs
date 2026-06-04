#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPackageSnapshots, readJson, toPosix } from './lib/package-inspection.mjs';

const ROOT = process.cwd();
const MAX_DETAILS_PER_PACKAGE = 12;

const isVirtualSource = (sourcePath) =>
  /^(?:dep:|browser-external:|virtual:|data:)|\0/.test(sourcePath);

const isExternalSource = (sourcePath) =>
  path.posix.isAbsolute(sourcePath) || /^[a-z][a-z0-9+.-]*:/i.test(sourcePath);

const hasSourceContent = (sourcesContent, index) =>
  Array.isArray(sourcesContent) && sourcesContent[index] != null;

const resolvePackedSource = (mapFile, sourceMap, sourcePath) => {
  if (isVirtualSource(sourcePath)) return null;
  if (isExternalSource(sourcePath)) return { packedPath: null, reason: 'external' };

  const sourceRoot = typeof sourceMap.sourceRoot === 'string' ? sourceMap.sourceRoot : '';
  if (sourceRoot && isExternalSource(sourceRoot)) {
    return { packedPath: null, reason: 'external sourceRoot' };
  }

  const packedPath = path.posix.normalize(
    path.posix.join(path.posix.dirname(mapFile), sourceRoot, sourcePath)
  );
  if (packedPath === '..' || packedPath.startsWith('../')) {
    return { packedPath, reason: 'outside package' };
  }
  return { packedPath, reason: 'missing' };
};

const getPackedSourcemapFiles = (packedFiles) =>
  [...packedFiles].filter((file) => file.endsWith('.js.map') || file.endsWith('.d.ts.map')).sort();

export const collectMissingSourcemapSources = ({ dir, packedFiles, packError }) => {
  if (packError) {
    throw packError;
  }
  if (!packedFiles) {
    throw new Error(
      'package snapshot is missing packedFiles; create snapshots with includePackedFiles'
    );
  }
  const missingSources = [];
  for (const mapFile of getPackedSourcemapFiles(packedFiles)) {
    const mapPath = path.join(dir, ...mapFile.split('/'));
    if (!existsSync(mapPath)) {
      missingSources.push(`${mapFile} is listed by npm pack but missing on disk`);
      continue;
    }

    const sourceMap = readJson(mapPath);
    const sources = Array.isArray(sourceMap.sources) ? sourceMap.sources : [];
    for (let index = 0; index < sources.length; index += 1) {
      const sourcePath = sources[index];
      if (!sourcePath || hasSourceContent(sourceMap.sourcesContent, index)) {
        continue;
      }

      const resolved = resolvePackedSource(mapFile, sourceMap, sourcePath);
      if (!resolved) continue;
      if (!resolved.packedPath || !packedFiles.has(resolved.packedPath)) {
        const target = resolved.packedPath
          ? `${sourcePath} (${resolved.reason}: ${resolved.packedPath})`
          : `${sourcePath} (${resolved.reason})`;
        missingSources.push(`${mapFile} -> ${target}`);
      }
    }
  }
  return missingSources;
};

export const collectSourcemapSourceFailures = ({
  root = ROOT,
  snapshots = createPackageSnapshots({ root, includePackedFiles: true }),
} = {}) => {
  const failures = [];
  for (const snapshot of snapshots) {
    try {
      const missingSources = collectMissingSourcemapSources(snapshot);
      if (missingSources.length > 0) {
        failures.push({
          name: snapshot.pkg.name || path.basename(snapshot.dir),
          dir: snapshot.relativeDir ?? toPosix(path.relative(root, snapshot.dir)),
          missingSources,
        });
      }
    } catch (error) {
      failures.push({
        name: snapshot.pkg.name || path.basename(snapshot.dir),
        dir: snapshot.relativeDir ?? toPosix(path.relative(root, snapshot.dir)),
        missingSources: [
          error.stderr?.toString()?.trim() ||
            error.message ||
            '<failed to inspect packed sourcemaps>',
        ],
      });
    }
  }
  return failures;
};

export const printSourcemapSourceResult = (
  { failures, checked },
  { log = console.log, error = console.error } = {}
) => {
  if (failures.length === 0) {
    log(`[check-sourcemap-sources] OK: validated ${checked} publishable package(s)`);
    return;
  }
  error(
    `[check-sourcemap-sources] Found ${failures.length} package(s) with sourcemaps that reference unpacked sources`
  );
  for (const failure of failures) {
    error(`\n- ${failure.name} (${failure.dir})`);
    for (const missing of failure.missingSources.slice(0, MAX_DETAILS_PER_PACKAGE)) {
      error(`  - ${missing}`);
    }
    const omitted = failure.missingSources.length - MAX_DETAILS_PER_PACKAGE;
    if (omitted > 0) {
      error(`  - ... ${omitted} more`);
    }
  }
};

export const runSourcemapSourceCheck = (options = {}) => {
  const snapshots =
    options.snapshots ??
    createPackageSnapshots({
      root: options.root ?? ROOT,
      includePackedFiles: true,
      packRunner: options.packRunner,
    });
  const failures = collectSourcemapSourceFailures({ root: options.root ?? ROOT, snapshots });
  const result = { ok: failures.length === 0, checked: snapshots.length, failures };
  printSourcemapSourceResult(result, options);
  return result;
};

const isDirectRun = () =>
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun()) {
  const result = runSourcemapSourceCheck();
  if (!result.ok) process.exit(1);
}
