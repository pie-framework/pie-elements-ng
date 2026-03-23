import { loadController, loadElement } from './element-loader';
import { loadIifePackage, type LocalBundleMeta } from './iife-bundle-loader';
import {
  normalizeElementPlayerStrategy,
  normalizeElementPlayerView,
  type ElementPlayerStrategy,
  type ElementPlayerView,
} from './player-strategy';

export interface UnifiedPlayerLoadRequest {
  strategy: string | null | undefined;
  view: string | null | undefined;
  elementName: string;
  packageName: string;
  elementVersion: string;
  cdnUrl?: string;
  iifeBundleEndpoint?: string;
  rebuildVersion?: number;
  preloadedFallbackStrategy?: ElementPlayerStrategy;
}

export interface UnifiedPlayerLoadResult {
  strategy: ElementPlayerStrategy;
  view: ElementPlayerView;
  tagName: string;
  controller?: any;
  bundleMeta?: LocalBundleMeta;
}

const iifeTagName = (elementName: string, view: ElementPlayerView): string => {
  if (view === 'delivery') {
    return `pie-iife-${elementName}`.replace(/[^a-z0-9-]/g, '-');
  }
  if (view === 'author') {
    return `${elementName}-configure`;
  }
  return `${elementName}-print`;
};

const esmTagName = (elementName: string, view: ElementPlayerView): string => {
  if (view === 'delivery') {
    return `${elementName}-element`;
  }
  if (view === 'author') {
    return `${elementName}-configure`;
  }
  return `${elementName}-print`;
};

function resolveExpectedTagName(
  strategy: ElementPlayerStrategy,
  view: ElementPlayerView,
  elementName: string
): string {
  if (strategy === 'iife') {
    return iifeTagName(elementName, view);
  }
  return esmTagName(elementName, view);
}

async function loadEsm(
  req: UnifiedPlayerLoadRequest,
  view: ElementPlayerView
): Promise<UnifiedPlayerLoadResult> {
  const tagName = esmTagName(req.elementName, view);
  const packagePath =
    view === 'delivery'
      ? req.packageName
      : view === 'author'
        ? `${req.packageName}/author`
        : `${req.packageName}/print`;

  await loadElement(packagePath, tagName, req.cdnUrl || '');
  await customElements.whenDefined(tagName);

  let controller: any;
  if (view === 'delivery' || view === 'author') {
    try {
      controller = await loadController(req.packageName, req.cdnUrl || '');
    } catch {
      controller = undefined;
    }
  }

  return {
    strategy: 'esm',
    view,
    tagName,
    controller,
  };
}

async function loadIife(
  req: UnifiedPlayerLoadRequest,
  view: ElementPlayerView
): Promise<UnifiedPlayerLoadResult> {
  const bundleTarget = view === 'author' ? 'editor' : view === 'print' ? 'player' : 'client-player';
  const { pkg, meta } = await loadIifePackage({
    packageName: req.packageName,
    version: req.elementVersion,
    endpoint: req.iifeBundleEndpoint,
    bundleTarget,
    forceRebuild: (req.rebuildVersion || 0) > 0,
    clearCache: (req.rebuildVersion || 0) > 0,
  });

  const tagName = iifeTagName(req.elementName, view);
  const exportClass =
    view === 'delivery' ? pkg.Element : view === 'author' ? pkg.Configure : pkg.Print;

  if (!exportClass) {
    throw new Error(`IIFE bundle is missing ${view} export for ${req.packageName}`);
  }

  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends exportClass {});
  }
  await customElements.whenDefined(tagName);

  let controller = pkg.controller;
  if (!controller && (view === 'delivery' || view === 'author')) {
    try {
      controller = await loadController(req.packageName, req.cdnUrl || '');
    } catch {
      controller = undefined;
    }
  }

  return {
    strategy: 'iife',
    view,
    tagName,
    controller,
    bundleMeta: meta,
  };
}

export async function loadUnifiedPlayer(
  request: UnifiedPlayerLoadRequest
): Promise<UnifiedPlayerLoadResult> {
  const strategy = normalizeElementPlayerStrategy(request.strategy, 'esm');
  const view = normalizeElementPlayerView(request.view, 'delivery');

  if (strategy === 'preloaded') {
    const fallback = normalizeElementPlayerStrategy(request.preloadedFallbackStrategy, 'esm');
    const preloadedTag = resolveExpectedTagName(fallback, view, request.elementName);
    if (customElements.get(preloadedTag)) {
      return {
        strategy: 'preloaded',
        view,
        tagName: preloadedTag,
      };
    }
    const fallbackRequest = { ...request, strategy: fallback } satisfies UnifiedPlayerLoadRequest;
    return loadUnifiedPlayer(fallbackRequest);
  }

  if (strategy === 'iife') {
    return loadIife(request, view);
  }

  return loadEsm(request, view);
}
