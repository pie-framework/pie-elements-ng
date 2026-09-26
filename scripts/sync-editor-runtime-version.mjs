#!/usr/bin/env node

// Points every pie.browserEditorRuntime.version at the editor runtime's current version.
//
// An element's editor-runtime variant is built against the workspace copy of
// @pie-element/shared-editor-runtime, and players load the runtime version the element declares.
// `bun run version` runs this after `changeset version` and skip-taken-prereleases.mjs have fixed
// the runtime's new version, so every element published in that release declares the runtime
// version the same release publishes.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getWorkspaceDirs, readJson } from './lib/package-inspection.mjs';

export const EDITOR_RUNTIME_DIR = path.join('packages', 'shared', 'editor-runtime');

/** Rewrites stale declarations and returns the names of the packages it changed. */
export function syncEditorRuntimeVersion({ root = process.cwd() } = {}) {
  const runtime = readJson(path.join(root, EDITOR_RUNTIME_DIR, 'package.json'));
  const updated = [];
  for (const dir of getWorkspaceDirs({ root })) {
    const manifestPath = path.join(dir, 'package.json');
    const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const declared = pkg.pie?.browserEditorRuntime;
    if (!declared || declared.name !== runtime.name || declared.version === runtime.version) {
      continue;
    }
    declared.version = runtime.version;
    writeFileSync(manifestPath, `${JSON.stringify(pkg, null, 2)}\n`);
    updated.push(pkg.name);
  }
  return { runtime: `${runtime.name}@${runtime.version}`, updated };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { runtime, updated } = syncEditorRuntimeVersion();
  console.log(
    updated.length === 0
      ? `[sync-editor-runtime-version] every declaration already names ${runtime}`
      : `[sync-editor-runtime-version] ${updated.length} package(s) now declare ${runtime}: ${updated.join(', ')}`
  );
}
