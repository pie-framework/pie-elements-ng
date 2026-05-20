import {
  configureElementModuleResolver,
  loadController,
  loadElement,
  loadRuntimeSupport,
  type ElementModuleResolver,
} from './element-loader';
import {
  DEFAULT_IIFE_BUNDLE_RETRY_CONFIG,
  type IifeBundleRetryConfig,
  type IifeBundleRetryStatus,
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
import {
  isRuntimeSupportEnabled,
  isStrategySupportedForView,
  normalizeRuntimeSupportCheck,
  type PieElementRuntimeSupport,
  type RuntimeSupportCheck,
} from './runtime-support';

export interface UnifiedPlayerLoadRequest {
  strategy: string | null | undefined;
  view: string | null | undefined;
  elementName: string;
  packageName: string;
  elementVersion: string;
  cdnUrl?: string;
  iifeBundleEndpoint?: string;
  iifeBundleHost?: string;
  iifeBundleRetry?: IifeBundleRetryConfig;
  onIifeBundleRetryStatus?: (status: IifeBundleRetryStatus) => void;
  signal?: AbortSignal;
  rebuildVersion?: number;
  preloadedFallbackStrategy?: ElementPlayerStrategy;
  runtimeSupportCheck?: RuntimeSupportCheck | string | null;
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
  requestedStrategy?: ElementPlayerStrategy;
  view: ElementPlayerView;
  tagName: string;
  controller?: any;
  bundleMeta?: LocalBundleMeta;
  controllerDiagnostic?: ControllerLoadDiagnostic;
  runtimeSupport?: PieElementRuntimeSupport;
  runtimeSupportDiagnostic?: RuntimeSupportDiagnostic;
  diagnostics?: {
    iife?: IifeBundleLoadError;
  };
}

export interface RuntimeSupportDiagnostic {
  status: 'loaded' | 'missing' | 'failed' | 'skipped';
  packageName: string;
  strategy: ElementPlayerStrategy;
  view: ElementPlayerView;
  message?: string;
}

const RUNTIME_SUPPORT_NEGATIVE_CACHE_MS = 30_000;
const runtimeSupportCache = new Map<string, PieElementRuntimeSupport>();
const runtimeSupportMissingCache = new Map<string, number>();

function enforceControllerContract(
  req: UnifiedPlayerLoadRequest,
  strategy: ElementPlayerStrategy,
  view: ElementPlayerView,
  diagnostic?: ControllerLoadDiagnostic
): void {
  // Keep delivery flows controller-driven, matching item-player expectations.
  if (view !== 'delivery') return;
  if (diagnostic?.status === 'loaded') return;
  const reason = diagnostic?.message || `controller status=${diagnostic?.status || 'missing'}`;
  throw new Error(
    `Controller contract violation for ${req.packageName} (${strategy}/${view}): ${reason}. ` +
      `Delivery mode requires a loadable controller.`
  );
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

function resolveRuntimeSupportCacheKey(request: UnifiedPlayerLoadRequest): string {
  return `${request.packageName}@${request.elementVersion || 'latest'}`;
}

function classifyRuntimeSupportMissing(error: unknown): boolean {
  const message = String(error || '').toLowerCase();
  return (
    message.includes('cannot find module') ||
    message.includes('no known conditions') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('404') ||
    message.includes('/runtime-support')
  );
}

async function resolveRuntimeSupport(
  req: UnifiedPlayerLoadRequest,
  strategy: ElementPlayerStrategy,
  view: ElementPlayerView
): Promise<{ runtimeSupport?: PieElementRuntimeSupport; diagnostic: RuntimeSupportDiagnostic }> {
  const mode = normalizeRuntimeSupportCheck(req.runtimeSupportCheck, 'off');
  if (!isRuntimeSupportEnabled(mode)) {
    return {
      runtimeSupport: undefined,
      diagnostic: {
        status: 'skipped',
        packageName: req.packageName,
        strategy,
        view,
      },
    };
  }

  const key = resolveRuntimeSupportCacheKey(req);
  const cached = runtimeSupportCache.get(key);
  if (cached) {
    return {
      runtimeSupport: cached,
      diagnostic: {
        status: 'loaded',
        packageName: req.packageName,
        strategy,
        view,
      },
    };
  }

  const missingAt = runtimeSupportMissingCache.get(key);
  if (missingAt && Date.now() - missingAt < RUNTIME_SUPPORT_NEGATIVE_CACHE_MS) {
    return {
      runtimeSupport: undefined,
      diagnostic: {
        status: 'missing',
        packageName: req.packageName,
        strategy,
        view,
        message: 'runtime-support missing (negative cache)',
      },
    };
  }

  try {
    const runtimeSupport = await loadRuntimeSupport(req.packageName, req.cdnUrl || '');
    runtimeSupportCache.set(key, runtimeSupport);
    runtimeSupportMissingCache.delete(key);
    return {
      runtimeSupport,
      diagnostic: {
        status: 'loaded',
        packageName: req.packageName,
        strategy,
        view,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (classifyRuntimeSupportMissing(error)) {
      runtimeSupportMissingCache.set(key, Date.now());
      return {
        runtimeSupport: undefined,
        diagnostic: {
          status: 'missing',
          packageName: req.packageName,
          strategy,
          view,
          message,
        },
      };
    }
    return {
      runtimeSupport: undefined,
      diagnostic: {
        status: 'failed',
        packageName: req.packageName,
        strategy,
        view,
        message,
      },
    };
  }
}

function buildRuntimeSupportLoadFailureHint(
  strategy: ElementPlayerStrategy,
  view: ElementPlayerView,
  packageName: string,
  runtimeSupport?: PieElementRuntimeSupport
): string {
  if (!runtimeSupport || (strategy !== 'esm' && strategy !== 'iife')) return '';
  const supported = isStrategySupportedForView(runtimeSupport, strategy, view);
  if (supported) return '';
  return ` Runtime support metadata indicates ${strategy}/${view} is unsupported for ${packageName}.`;
}

async function loadEsm(
  req: UnifiedPlayerLoadRequest,
  view: ElementPlayerView,
  requestedStrategy?: ElementPlayerStrategy,
  runtimeSupport?: PieElementRuntimeSupport,
  runtimeSupportDiagnostic?: RuntimeSupportDiagnostic
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
  enforceControllerContract(req, 'esm', view, diagnostic);

  return {
    strategy: 'esm',
    requestedStrategy,
    view,
    tagName,
    controller,
    controllerDiagnostic: diagnostic,
    runtimeSupport,
    runtimeSupportDiagnostic,
  };
}

async function loadIife(
  req: UnifiedPlayerLoadRequest,
  view: ElementPlayerView,
  requestedStrategy?: ElementPlayerStrategy,
  runtimeSupport?: PieElementRuntimeSupport,
  runtimeSupportDiagnostic?: RuntimeSupportDiagnostic
): Promise<UnifiedPlayerLoadResult> {
  const bundleTarget = view === 'author' ? 'editor' : view === 'print' ? 'player' : 'client-player';
  const { pkg, meta } = await loadIifePackage({
    packageName: req.packageName,
    version: req.elementVersion,
    endpoint: req.iifeBundleEndpoint,
    bundleHost: req.iifeBundleHost,
    iifeBundleRetry: req.iifeBundleRetry ?? DEFAULT_IIFE_BUNDLE_RETRY_CONFIG,
    onRetryStatus: req.onIifeBundleRetryStatus,
    signal: req.signal,
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
    if (view === 'delivery') {
      controllerDiagnostic = {
        status: 'missing',
        source: 'bundle',
        packageName: req.packageName,
        strategy: 'iife',
        view,
        message: 'client-player bundle did not include controller export',
      };
    } else {
      const moduleController = await resolveModuleController(req, 'iife', view);
      controller = moduleController.controller;
      controllerDiagnostic = moduleController.diagnostic;
    }
  }
  enforceControllerContract(req, 'iife', view, controllerDiagnostic);

  return {
    strategy: 'iife',
    requestedStrategy,
    view,
    tagName,
    controller,
    bundleMeta: meta,
    controllerDiagnostic,
    runtimeSupport,
    runtimeSupportDiagnostic,
  };
}

export async function loadUnifiedPlayer(
  request: UnifiedPlayerLoadRequest
): Promise<UnifiedPlayerLoadResult> {
  const requestedStrategy = normalizeElementPlayerStrategy(request.strategy, 'esm');
  const strategy = requestedStrategy;
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

  const runtimeSupportResolution = await resolveRuntimeSupport(request, strategy, view);
  try {
    if (strategy === 'iife') {
      return loadIife(
        request,
        view,
        requestedStrategy,
        runtimeSupportResolution.runtimeSupport,
        runtimeSupportResolution.diagnostic
      );
    }

    return loadEsm(
      request,
      view,
      requestedStrategy,
      runtimeSupportResolution.runtimeSupport,
      runtimeSupportResolution.diagnostic
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const hint = buildRuntimeSupportLoadFailureHint(
      strategy,
      view,
      request.packageName,
      runtimeSupportResolution.runtimeSupport
    );
    throw new Error(`${message}${hint}`);
  }
}
