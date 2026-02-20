/**
 * SvelteKit API endpoint for PIE bundler
 * POST /api/bundle - Build a bundle
 * GET /api/bundle?hash={hash} - Check if bundle exists
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Bundler } from '@pie-element/bundler-shared';
import type { BuildBundleName } from '@pie-element/bundler-shared';
import { join } from 'node:path';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { mkDependencyHash } from '@pie-element/bundler-shared';
import { createOrJoinBuild, emitBuildEvent, getBuildSnapshot } from './build-state';

const DEFAULT_INSTANCE_DIR = join(process.cwd(), '.cache', 'demo-bundler');
const instanceDir = process.env.DEMO_BUNDLER_INSTANCE_DIR || DEFAULT_INSTANCE_DIR;
const localWorkspaceRoot = join(process.cwd(), '..', '..');
const resolutionMode =
  process.env.DEMO_BUNDLER_RESOLUTION_MODE === 'prod-faithful' ? 'prod-faithful' : 'workspace-fast';
const enableSourceMaps = process.env.DEMO_BUNDLER_SOURCEMAPS !== '0';
const VALID_BUNDLES = new Set<BuildBundleName>(['player', 'client-player', 'editor']);
const INIT_MARKER_PATH = join(instanceDir, '.demo-bundler-initialized');

function isBuildBundleName(value: unknown): value is BuildBundleName {
  return typeof value === 'string' && VALID_BUNDLES.has(value as BuildBundleName);
}

let initialized = false;
let bundler: Bundler | null = null;

function clearWorkspacePaths() {
  const outputDir = join(instanceDir, 'bundles');
  const cacheDir = join(instanceDir, 'cache');
  rmSync(outputDir, { recursive: true, force: true });
  rmSync(cacheDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });
}

function clearBundleForDependencies(dependencies: Array<{ name: string; version: string }>) {
  const hash = mkDependencyHash(dependencies);
  rmSync(join(instanceDir, 'bundles', hash), { recursive: true, force: true });
  rmSync(join(instanceDir, 'cache', hash), { recursive: true, force: true });
}

function getBundler(): Bundler {
  if (bundler) {
    return bundler;
  }

  const outputDir = join(instanceDir, 'bundles');
  const cacheDir = join(instanceDir, 'cache');

  if (!initialized) {
    // Clear once per dev:demo instance directory. In dev, module reloads can
    // re-run this file; a disk marker prevents wiping cache on each request.
    if (!existsSync(INIT_MARKER_PATH)) {
      clearWorkspacePaths();
      writeFileSync(INIT_MARKER_PATH, new Date().toISOString(), 'utf-8');
    }
    initialized = true;
  }

  bundler = new Bundler(outputDir, cacheDir);
  return bundler;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const buildRequest = (await request.json()) as {
      dependencies?: Array<{ name?: string; version?: string }>;
      clearCache?: boolean;
      forceRebuild?: boolean;
      requestedBundles?: unknown[];
      wait?: boolean;
    };

    // Validate request
    if (!buildRequest.dependencies || !Array.isArray(buildRequest.dependencies)) {
      return json({ error: 'dependencies array required' }, { status: 400 });
    }

    if (buildRequest.dependencies.length === 0) {
      return json({ error: 'at least one dependency required' }, { status: 400 });
    }

    // Validate each dependency
    for (const dep of buildRequest.dependencies) {
      if (!dep.name || !dep.version) {
        return json({ error: 'each dependency must have name and version' }, { status: 400 });
      }
    }
    const dependencies = buildRequest.dependencies as Array<{ name: string; version: string }>;

    if (buildRequest.clearCache === true) {
      clearWorkspacePaths();
    } else if (buildRequest.forceRebuild === true) {
      clearBundleForDependencies(dependencies);
    }

    const requestedBundles = Array.isArray(buildRequest.requestedBundles)
      ? Array.from(new Set(buildRequest.requestedBundles.filter(isBuildBundleName))).sort()
      : undefined;

    console.log('[api/bundle] Build request:', {
      deps: dependencies,
      requestedBundles: requestedBundles || ['player', 'client-player', 'editor'],
      forceRebuild: !!buildRequest.forceRebuild,
      clearCache: !!buildRequest.clearCache,
      sourceMaps: enableSourceMaps,
      wait: buildRequest.wait !== false,
    });
    const hash = mkDependencyHash(dependencies);
    const buildKey = `${hash}:${(requestedBundles || ['player', 'client-player', 'editor']).join(',')}:sourcemaps=${enableSourceMaps}`;
    const waitForResult = buildRequest.wait !== false;
    console.log('[api/bundle] Build key:', { hash, buildKey });
    const build = createOrJoinBuild(
      buildKey,
      {
        dependencies,
        options: {
          resolutionMode,
          workspaceRoot: resolutionMode === 'workspace-fast' ? localWorkspaceRoot : undefined,
          requestedBundles,
          sourceMaps: enableSourceMaps,
        },
      },
      hash,
      async (buildId, req) =>
        getBundler().build(
          {
            ...req,
            options: {
              ...req.options,
              buildId,
            },
          },
          (event) => emitBuildEvent(buildId, event)
        )
    );
    console.log('[api/bundle] Build state:', { buildId: build.buildId, joined: build.joined });

    if (!waitForResult) {
      return json(
        {
          buildId: build.buildId,
          hash,
          joined: build.joined,
          statusUrl: `/api/bundle?buildId=${encodeURIComponent(build.buildId)}`,
          eventsUrl: `/api/bundle/events?buildId=${encodeURIComponent(build.buildId)}`,
          source: 'local',
        },
        { status: 202 }
      );
    }

    const result = await build.promise;
    console.log('[api/bundle] Build result:', {
      buildId: build.buildId,
      success: result.success,
      cached: !!result.cached,
      duration: result.duration,
      bundleKeys: result.bundles ? Object.keys(result.bundles) : [],
    });
    return json(
      {
        buildId: build.buildId,
        ...result,
        source: 'local',
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error: any) {
    console.error('[api/bundle] Error:', error);
    return json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  const buildId = url.searchParams.get('buildId');
  if (buildId) {
    const snapshot = getBuildSnapshot(buildId);
    if (!snapshot) {
      return json({ error: 'buildId not found' }, { status: 404 });
    }
    return json({
      ...snapshot,
      source: 'local',
    });
  }

  const hash = url.searchParams.get('hash');

  if (!hash) {
    return json({ error: 'hash parameter required' }, { status: 400 });
  }

  const exists = getBundler().exists(hash);

  if (exists) {
    return json({
      exists: true,
      bundles: getBundler().getBundleUrls(hash),
      source: 'local',
    });
  }

  return json({ exists: false });
};
