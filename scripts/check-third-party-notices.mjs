#!/usr/bin/env node

/**
 * Assert every publishable package ships the license notices of the third-party code it bundles.
 *
 * Every Vite build in the workspace must use `thirdPartyLicenses()` from
 * `tools/vite/third-party-licenses.ts`, directly or through the config it extends; private packages
 * count, since published ones bundle their output. Each publishable tarball must then name, in the
 * notices file covering each file, every installed package that a sourcemap's sources or a vendored
 * path shows bundled, and every package listed by the notices of another workspace build it
 * bundles. An IIFE always bundles its dependencies, so a packed `*.iife.js` needs a notices file
 * even without a sourcemap.
 *
 * Usage:
 *   bun ./scripts/check-third-party-notices.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  installedPackageRoot,
  noticedPackageNames,
  noticesCovering,
} from '../tools/vite/third-party-licenses.ts';
import { createPackageSnapshots, readJson, toPosix } from './lib/package-inspection.mjs';

const ROOT = process.cwd();
const MAX_DETAILS_PER_PACKAGE = 12;
const VENDORED = /(?:^|\/)vendor\/[^/]+@[^/]+\/vendor\/((?:@[^/]+\/)?[^/]+)\//;

const DEFAULT_CONFIGS = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'];

/** The config files of the `vite build` steps in a package's `build` script. */
export const viteBuildConfigs = (dir, pkg) =>
  (pkg.scripts?.build ?? '')
    .split(/&&|\|\||;/)
    .filter((step) => /\bvite build\b/.test(step))
    .map((step) => {
      const named = step.match(/(?:--config|-c)[\s=]+(\S+)/)?.[1];
      if (named) return path.resolve(dir, named);
      const found = DEFAULT_CONFIGS.find((name) => existsSync(path.join(dir, name)));
      return path.join(dir, found ?? DEFAULT_CONFIGS[0]);
    });

/** Whether a config uses the plugin, itself or through a relative `*.config.ts` it imports. */
export const configUsesNoticesPlugin = (configPath) => {
  const text = readFileSync(configPath, 'utf8');
  if (text.includes('thirdPartyLicenses(')) return true;
  return [...text.matchAll(/from\s+'(\.[^']+\.config\.ts)'/g)].some(([, specifier]) => {
    const base = path.resolve(path.dirname(configPath), specifier);
    return existsSync(base) && readFileSync(base, 'utf8').includes('thirdPartyLicenses(');
  });
};

/** The installed package `file` belongs to, by its manifest when it has one, else by its path. */
const installedPackageName = (file) => {
  const root = installedPackageRoot(file);
  if (!root) return VENDORED.exec(file)?.[1] ?? null;
  const manifest = path.join(root, 'package.json');
  return existsSync(manifest)
    ? readJson(manifest).name
    : root.slice(root.lastIndexOf('/node_modules/') + 14);
};

/** The Vite builds in a package's `build` script that do not use the notices plugin. */
export const collectConfigGaps = ({ dir, pkg }, { root = ROOT } = {}) =>
  viteBuildConfigs(dir, pkg).flatMap((config) => {
    const shown = toPosix(path.relative(root, config));
    if (!existsSync(config)) return [`build script names ${shown}, which does not exist`];
    return configUsesNoticesPlugin(config) ? [] : [`${shown} does not use thirdPartyLicenses()`];
  });

/** The packed files of a package whose bundled third-party code lacks its notices. */
export const collectNoticeGaps = ({ dir, packedFiles, packError }) => {
  if (packError) throw packError;
  if (!packedFiles) {
    throw new Error(
      'package snapshot is missing packedFiles; create snapshots with includePackedFiles'
    );
  }
  const gaps = [];
  const byDir = new Map();
  const namesByNotices = new Map();
  const namesIn = (noticesPath) => {
    if (!namesByNotices.has(noticesPath)) {
      namesByNotices.set(noticesPath, noticedPackageNames(readFileSync(noticesPath, 'utf8')));
    }
    return namesByNotices.get(noticesPath);
  };

  for (const file of [...packedFiles].sort()) {
    const absolute = path.join(dir, ...file.split('/'));
    if (!existsSync(absolute)) continue;
    const bundled = new Set();
    const vendored = installedPackageName(toPosix(absolute));
    if (vendored && /\.[cm]?js$/.test(file)) bundled.add(vendored);
    if (file.endsWith('.js.map')) {
      const map = readJson(absolute);
      const sourceRoot = typeof map.sourceRoot === 'string' ? map.sourceRoot : '';
      for (const source of Array.isArray(map.sources) ? map.sources : []) {
        if (!source || /^[a-z][a-z0-9+.-]*:|\0/i.test(source)) continue;
        const resolved = toPosix(path.resolve(path.dirname(absolute), sourceRoot, source));
        const name = installedPackageName(resolved);
        if (name) bundled.add(name);
        else if (!resolved.startsWith(`${toPosix(dir)}/`)) {
          const covering = noticesCovering(resolved, byDir);
          if (covering) for (const listed of namesIn(covering)) bundled.add(listed);
        }
      }
    }
    const isIife = file.endsWith('.iife.js');
    if (bundled.size === 0 && !isIife) continue;

    const target = file.endsWith('.map') ? absolute.slice(0, -'.map'.length) : absolute;
    const covering = noticesCovering(toPosix(target), byDir);
    const coveringPacked = covering && toPosix(path.relative(dir, covering));
    if (!covering || !packedFiles.has(coveringPacked)) {
      gaps.push(
        `${file} bundles ${bundled.size > 0 ? [...bundled].sort().join(', ') : 'its dependencies'} and no packed notices file covers it`
      );
      continue;
    }
    const missing = [...bundled].filter((name) => !namesIn(covering).has(name)).sort();
    if (missing.length > 0)
      gaps.push(`${coveringPacked} omits ${missing.join(', ')}, bundled into ${file}`);
  }
  return gaps;
};

const failureOf = (snapshot, root, collect) => {
  const name = snapshot.pkg.name || path.basename(snapshot.dir);
  const dir = snapshot.relativeDir ?? toPosix(path.relative(root, snapshot.dir));
  try {
    const gaps = collect(snapshot);
    return gaps.length > 0 ? { name, dir, gaps } : null;
  } catch (error) {
    return { name, dir, gaps: [error.message || '<failed to inspect packed files>'] };
  }
};

export const collectThirdPartyNoticeFailures = ({
  root = ROOT,
  snapshots = createPackageSnapshots({ root, includePackedFiles: true }),
  workspaceSnapshots = createPackageSnapshots({ root, includePrivate: true }),
} = {}) => {
  const byDir = new Map();
  const add = (failure) => {
    if (!failure) return;
    const known = byDir.get(failure.dir);
    if (known) known.gaps.push(...failure.gaps);
    else byDir.set(failure.dir, failure);
  };
  for (const snapshot of workspaceSnapshots)
    add(failureOf(snapshot, root, (s) => collectConfigGaps(s, { root })));
  for (const snapshot of snapshots) add(failureOf(snapshot, root, collectNoticeGaps));
  return [...byDir.values()];
};

export const runThirdPartyNoticeCheck = (options = {}) => {
  const root = options.root ?? ROOT;
  const snapshots =
    options.snapshots ??
    createPackageSnapshots({ root, includePackedFiles: true, packRunner: options.packRunner });
  const failures = collectThirdPartyNoticeFailures({
    root,
    snapshots,
    workspaceSnapshots:
      options.workspaceSnapshots ?? createPackageSnapshots({ root, includePrivate: true }),
  });
  const { log = console.log, error = console.error } = options;
  if (failures.length === 0) {
    log(`[check-third-party-notices] OK: validated ${snapshots.length} publishable package(s)`);
  } else {
    error(
      `[check-third-party-notices] ${failures.length} package(s) ship bundled code without its license notices`
    );
    for (const failure of failures) {
      error(`\n- ${failure.name} (${failure.dir})`);
      for (const gap of failure.gaps.slice(0, MAX_DETAILS_PER_PACKAGE)) error(`  - ${gap}`);
      const omitted = failure.gaps.length - MAX_DETAILS_PER_PACKAGE;
      if (omitted > 0) error(`  - ... ${omitted} more`);
    }
    error(
      '\nBuild with thirdPartyLicenses() from tools/vite/third-party-licenses.ts in every Vite config.'
    );
  }
  return { ok: failures.length === 0, checked: snapshots.length, failures };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!runThirdPartyNoticeCheck().ok) process.exit(1);
}
