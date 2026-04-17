type IifeBundleTarget = 'player' | 'client-player' | 'editor';

export interface IifeBundleRetryConfig {
  retryDelayMs?: number;
  timeoutMs?: number;
}

export interface IifeBundleRetryStatus {
  state: 'retrying' | 'completed' | 'timeout' | 'cancelled';
  stage: 'build-start' | 'build-status' | 'script-load';
  attempt: number;
  elapsedMs: number;
  retryDelayMs?: number;
  timeoutMs: number;
  reason?: string;
}

export const DEFAULT_IIFE_BUNDLE_RETRY_CONFIG = {
  retryDelayMs: 3000,
  timeoutMs: 120000,
} as const;

export interface LocalBundleMeta {
  hash?: string;
  duration?: number;
  cached?: boolean;
  source: 'local';
  url: string;
}

export interface IifePackageExports {
  Element?: CustomElementConstructor;
  Print?: CustomElementConstructor;
  controller?: any;
  Configure?: CustomElementConstructor;
}

export interface IifeBuildResult {
  success: boolean;
  bundles?: { player?: string; clientPlayer?: string; editor?: string };
  hash: string;
  duration: number;
  cached?: boolean;
  errors?: string[];
}

export class IifeBundleLoadError extends Error {
  code:
    | 'BUILD_START_FAILED'
    | 'BUILD_STATUS_FAILED'
    | 'BUILD_RESULT_FAILED'
    | 'BUNDLE_URL_MISSING'
    | 'SCRIPT_LOAD_FAILED'
    | 'REGISTRY_INVALID'
    | 'PACKAGE_MISSING'
    | 'LOAD_ABORTED';
  metadata?: Record<string, unknown>;

  constructor(
    code:
      | 'BUILD_START_FAILED'
      | 'BUILD_STATUS_FAILED'
      | 'BUILD_RESULT_FAILED'
      | 'BUNDLE_URL_MISSING'
      | 'SCRIPT_LOAD_FAILED'
      | 'REGISTRY_INVALID'
      | 'PACKAGE_MISSING'
      | 'LOAD_ABORTED',
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IifeBundleLoadError';
    this.code = code;
    this.metadata = metadata;
  }
}

export interface IifeBuildClient {
  startBuild(request: {
    endpoint: string;
    packageName: string;
    version: string;
    bundleTarget: IifeBundleTarget;
    forceRebuild: boolean;
    clearCache: boolean;
  }): Promise<{ buildId: string; hash?: string }>;
  waitForBuildResult(request: {
    endpoint: string;
    buildId: string;
    onProgress?: (event: { stage: string; message?: string }) => void;
  }): Promise<IifeBuildResult>;
}

export interface IifeRegistryClient {
  load(url: string): Promise<Record<string, IifePackageExports>>;
}

export interface IifeBundleLoaderAdapters {
  buildClient?: IifeBuildClient;
  registryClient?: IifeRegistryClient;
}

function normalizeRetryConfig(input?: IifeBundleRetryConfig): Required<IifeBundleRetryConfig> {
  const retryDelayMs =
    typeof input?.retryDelayMs === 'number' && input.retryDelayMs > 0
      ? input.retryDelayMs
      : DEFAULT_IIFE_BUNDLE_RETRY_CONFIG.retryDelayMs;
  const timeoutMs =
    typeof input?.timeoutMs === 'number' && input.timeoutMs > 0
      ? input.timeoutMs
      : DEFAULT_IIFE_BUNDLE_RETRY_CONFIG.timeoutMs;
  return { retryDelayMs, timeoutMs };
}

function isRetryableIifeError(error: unknown): error is IifeBundleLoadError {
  if (!(error instanceof IifeBundleLoadError)) return false;
  return (
    error.code === 'SCRIPT_LOAD_FAILED' ||
    error.code === 'BUILD_START_FAILED' ||
    error.code === 'BUILD_STATUS_FAILED'
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : String(error);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  throw new IifeBundleLoadError('LOAD_ABORTED', 'IIFE bundle load aborted');
}

async function waitWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    await wait(ms);
    return;
  }
  if (signal.aborted) {
    throwIfAborted(signal);
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(new IifeBundleLoadError('LOAD_ABORTED', 'IIFE bundle load aborted'));
    };
    signal.addEventListener('abort', onAbort);
  });
}

interface BuildStartResponse {
  buildId: string;
  hash: string;
}

interface BuildStatusResponse {
  stage: string;
  done: boolean;
  result?: {
    success: boolean;
    bundles?: {
      player?: string;
      clientPlayer?: string;
      editor?: string;
    };
    hash: string;
    duration: number;
    cached?: boolean;
    errors?: string[];
  };
  error?: string;
}

const scriptLoads = new Map<string, Promise<Record<string, IifePackageExports>>>();
let configuredAdapters: IifeBundleLoaderAdapters = {};

export function configureIifeBundleLoader(adapters?: IifeBundleLoaderAdapters): void {
  configuredAdapters = adapters ?? {};
}

function resolvePieRegistry(): Record<string, IifePackageExports> {
  const pieGlobal = (window as any).pie;
  if (!pieGlobal) {
    throw new IifeBundleLoadError(
      'REGISTRY_INVALID',
      'window.pie not found after loading IIFE bundle'
    );
  }
  const registry = pieGlobal.default || pieGlobal;
  if (!registry || typeof registry !== 'object') {
    throw new IifeBundleLoadError('REGISTRY_INVALID', 'Invalid IIFE package registry shape');
  }
  return registry;
}

function loadScript(url: string): Promise<Record<string, IifePackageExports>> {
  const existing = scriptLoads.get(url);
  if (existing) {
    return existing;
  }

  const promise = new Promise<Record<string, IifePackageExports>>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.defer = true;
    script.dataset.pieBundle = 'true';
    script.onload = () => {
      try {
        resolve(resolvePieRegistry());
      } catch (error) {
        scriptLoads.delete(url);
        reject(
          error instanceof Error
            ? error
            : new IifeBundleLoadError('REGISTRY_INVALID', String(error))
        );
      }
    };
    script.onerror = () => {
      scriptLoads.delete(url);
      reject(
        new IifeBundleLoadError('SCRIPT_LOAD_FAILED', `Failed to load IIFE bundle: ${url}`, {
          url,
        })
      );
    };
    document.head.appendChild(script);
  });

  scriptLoads.set(url, promise);
  return promise;
}

function getBundleUrl(
  bundles: { player?: string; clientPlayer?: string; editor?: string } | undefined,
  bundleTarget: IifeBundleTarget
): string {
  if (!bundles) {
    return '';
  }
  if (bundleTarget === 'player') {
    return bundles.player || '';
  }
  return bundleTarget === 'editor' ? bundles.editor || '' : bundles.clientPlayer || '';
}

const defaultBuildClient: IifeBuildClient = {
  async startBuild(request) {
    const response = await fetch(request.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dependencies: [{ name: request.packageName, version: request.version }],
        requestedBundles:
          request.bundleTarget === 'editor'
            ? ['editor']
            : request.bundleTarget === 'player'
              ? ['player']
              : ['client-player'],
        forceRebuild: request.forceRebuild,
        clearCache: request.clearCache,
        wait: false,
      }),
    });

    const startPayload = (await response.json()) as BuildStartResponse & { error?: string };
    if (!response.ok || !startPayload.buildId) {
      throw new IifeBundleLoadError(
        'BUILD_START_FAILED',
        startPayload.error || 'Local bundle build failed',
        { endpoint: request.endpoint, packageName: request.packageName }
      );
    }
    return { buildId: startPayload.buildId, hash: startPayload.hash };
  },

  async waitForBuildResult({ buildId, endpoint, onProgress }) {
    for (;;) {
      const res = await fetch(`${endpoint}?buildId=${encodeURIComponent(buildId)}`);
      const status = (await res.json()) as BuildStatusResponse;
      if (!res.ok) {
        throw new IifeBundleLoadError(
          'BUILD_STATUS_FAILED',
          status.error || 'Failed to poll build status',
          { endpoint, buildId, stage: status.stage }
        );
      }
      onProgress?.({ stage: status.stage });
      if (status.done) {
        if (status.result?.success) {
          return status.result;
        }
        throw new IifeBundleLoadError(
          'BUILD_RESULT_FAILED',
          status.error || status.result?.errors?.join('\n') || 'Build failed',
          { endpoint, buildId, errors: status.result?.errors }
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  },
};

const defaultRegistryClient: IifeRegistryClient = {
  load: (url) => loadScript(url),
};

export async function loadIifePackage(opts: {
  packageName: string;
  version: string;
  endpoint?: string;
  forceRebuild?: boolean;
  clearCache?: boolean;
  bundleTarget?: IifeBundleTarget;
  iifeBundleRetry?: IifeBundleRetryConfig;
  onProgress?: (event: { stage: string; message?: string }) => void;
  onRetryStatus?: (status: IifeBundleRetryStatus) => void;
  signal?: AbortSignal;
  adapters?: IifeBundleLoaderAdapters;
}): Promise<{ pkg: IifePackageExports; meta: LocalBundleMeta }> {
  const bundleTarget = opts.bundleTarget || 'client-player';
  const endpoint = opts.endpoint || '/api/bundle';
  const retryConfig = normalizeRetryConfig(opts.iifeBundleRetry);
  const adapters = opts.adapters ?? configuredAdapters;
  const buildClient = adapters.buildClient ?? defaultBuildClient;
  const registryClient = adapters.registryClient ?? defaultRegistryClient;
  const startedAt = Date.now();
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      throwIfAborted(opts.signal);
      const startPayload = await buildClient.startBuild({
        endpoint,
        packageName: opts.packageName,
        version: opts.version,
        bundleTarget,
        forceRebuild: !!opts.forceRebuild,
        clearCache: !!opts.clearCache,
      });

      opts.onProgress?.({ stage: 'queued' });
      const payload = await buildClient.waitForBuildResult({
        buildId: startPayload.buildId,
        endpoint,
        onProgress: opts.onProgress,
      });
      throwIfAborted(opts.signal);
      if (!payload.success) {
        throw new IifeBundleLoadError(
          'BUILD_RESULT_FAILED',
          payload.errors?.join('\n') || 'Local bundle build failed',
          { packageName: opts.packageName, endpoint }
        );
      }

      let bundleUrl = getBundleUrl(payload.bundles, bundleTarget);
      if (!bundleUrl) {
        throw new IifeBundleLoadError('BUNDLE_URL_MISSING', 'Bundle URL was not returned', {
          packageName: opts.packageName,
          bundleTarget,
        });
      }

      const separator = bundleUrl.includes('?') ? '&' : '?';
      bundleUrl = `${bundleUrl}${separator}buildId=${encodeURIComponent(startPayload.buildId)}`;
      if (opts.forceRebuild) {
        const secondSeparator = bundleUrl.includes('?') ? '&' : '?';
        bundleUrl = `${bundleUrl}${secondSeparator}rebuild=${Date.now()}`;
      }

      const meta: LocalBundleMeta = {
        source: 'local',
        hash: payload.hash,
        duration: payload.duration,
        cached: payload.cached,
        url: bundleUrl,
      };

      const registry = await registryClient.load(bundleUrl);
      throwIfAborted(opts.signal);
      const pkg = registry[opts.packageName];
      if (!pkg) {
        throw new IifeBundleLoadError(
          'PACKAGE_MISSING',
          `Package ${opts.packageName} not found in loaded bundle. Available: ${Object.keys(registry).join(', ')}`,
          { packageName: opts.packageName, availablePackages: Object.keys(registry) }
        );
      }

      if (attempt > 1) {
        const elapsedMs = Date.now() - startedAt;
        console.info(
          `[iife-bundle-loader] retry recovered after ${attempt} attempts (${elapsedMs}ms): ${opts.packageName}@${opts.version}`
        );
      }
      opts.onRetryStatus?.({
        state: 'completed',
        stage: 'script-load',
        attempt,
        elapsedMs: Date.now() - startedAt,
        timeoutMs: retryConfig.timeoutMs,
      });
      return { pkg, meta };
    } catch (error) {
      if (error instanceof IifeBundleLoadError && error.code === 'LOAD_ABORTED') {
        opts.onRetryStatus?.({
          state: 'cancelled',
          stage: 'build-status',
          attempt,
          elapsedMs: Date.now() - startedAt,
          timeoutMs: retryConfig.timeoutMs,
          reason: toErrorMessage(error),
        });
        throw error;
      }
      if (!isRetryableIifeError(error)) {
        throw error;
      }
      const elapsedMs = Date.now() - startedAt;
      const remainingMs = retryConfig.timeoutMs - elapsedMs;
      const message = toErrorMessage(error);
      if (remainingMs <= 0) {
        opts.onRetryStatus?.({
          state: 'timeout',
          stage: error.code === 'SCRIPT_LOAD_FAILED' ? 'script-load' : 'build-status',
          attempt,
          elapsedMs,
          timeoutMs: retryConfig.timeoutMs,
          reason: message,
        });
        throw new IifeBundleLoadError(
          'BUILD_RESULT_FAILED',
          `IIFE bundle load timed out after ${retryConfig.timeoutMs}ms: ${message}`,
          {
            packageName: opts.packageName,
            endpoint,
            attempt,
            elapsedMs,
            timeoutMs: retryConfig.timeoutMs,
          }
        );
      }

      const retryDelayMs = Math.min(retryConfig.retryDelayMs, remainingMs);
      const stage: IifeBundleRetryStatus['stage'] =
        error.code === 'SCRIPT_LOAD_FAILED'
          ? 'script-load'
          : error.code === 'BUILD_START_FAILED'
            ? 'build-start'
            : 'build-status';
      console.warn(
        `[iife-bundle-loader] bundle may still be building (attempt ${attempt}, stage=${stage}); retrying in ${retryDelayMs}ms`,
        { packageName: opts.packageName, endpoint, message }
      );
      opts.onRetryStatus?.({
        state: 'retrying',
        stage,
        attempt,
        elapsedMs,
        retryDelayMs,
        timeoutMs: retryConfig.timeoutMs,
        reason: message,
      });
      await waitWithAbort(retryDelayMs, opts.signal);
    }
  }
}
