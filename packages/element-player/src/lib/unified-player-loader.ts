import {
  configureElementModuleResolver,
  loadController,
  loadElement,
  type ElementModuleResolver,
} from './element-loader';
import {
  loadIifePackage,
  type IifeBundleLoadError,
  type LocalBundleMeta,
} from './iife-bundle-loader';
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

export interface ControllerLoadDiagnostic {
  status: 'loaded' | 'missing' | 'failed' | 'not-required';
  source: 'module' | 'bundle' | 'none';
  packageName: string;
  strategy: ElementPlayerStrategy;
  view: ElementPlayerView;
  message?: string;
}

export interface UnifiedPlayerLoadResult {
  strategy: ElementPlayerStrategy;
  view: ElementPlayerView;
  tagName: string;
  controller?: any;
  bundleMeta?: LocalBundleMeta;
  controllerDiagnostic?: ControllerLoadDiagnostic;
  diagnostics?: {
    iife?: IifeBundleLoadError;
  };
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

function createNotRequiredControllerDiagnostic(
  packageName: string,
  strategy: ElementPlayerStrategy,
  view: ElementPlayerView
): ControllerLoadDiagnostic {
  return {
    status: 'not-required',
    source: 'none',
    packageName,
    strategy,
    view,
  };
}

async function resolveModuleController(
  req: UnifiedPlayerLoadRequest,
  strategy: ElementPlayerStrategy,
  view: ElementPlayerView
): Promise<{ controller?: any; diagnostic: ControllerLoadDiagnostic }> {
  if (view !== 'delivery' && view !== 'author') {
    return {
      controller: undefined,
      diagnostic: createNotRequiredControllerDiagnostic(req.packageName, strategy, view),
    };
  }

  try {
    const controller = await loadController(req.packageName, req.cdnUrl || '');
    return {
      controller,
      diagnostic: {
        status: controller ? 'loaded' : 'missing',
        source: 'module',
        packageName: req.packageName,
        strategy,
        view,
        message: controller ? undefined : 'Controller module resolved without exports',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      controller: undefined,
      diagnostic: {
        status: 'failed',
        source: 'module',
        packageName: req.packageName,
        strategy,
        view,
        message,
      },
    };
  }
}

export function configureUnifiedPlayerResolver(resolver?: ElementModuleResolver): void {
  configureElementModuleResolver(resolver);
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

  const { controller, diagnostic } = await resolveModuleController(req, 'esm', view);

  return {
    strategy: 'esm',
    view,
    tagName,
    controller,
    controllerDiagnostic: diagnostic,
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
  let controllerDiagnostic: ControllerLoadDiagnostic;
  if (controller) {
    controllerDiagnostic = {
      status: 'loaded',
      source: 'bundle',
      packageName: req.packageName,
      strategy: 'iife',
      view,
    };
  } else {
    const moduleController = await resolveModuleController(req, 'iife', view);
    controller = moduleController.controller;
    controllerDiagnostic = moduleController.diagnostic;
  }

  return {
    strategy: 'iife',
    view,
    tagName,
    controller,
    bundleMeta: meta,
    controllerDiagnostic,
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
