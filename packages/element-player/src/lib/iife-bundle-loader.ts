type IifeBundleTarget = 'player' | 'client-player' | 'editor';

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
    | 'PACKAGE_MISSING';
  metadata?: Record<string, unknown>;

  constructor(
    code:
      | 'BUILD_START_FAILED'
      | 'BUILD_STATUS_FAILED'
      | 'BUILD_RESULT_FAILED'
      | 'BUNDLE_URL_MISSING'
      | 'SCRIPT_LOAD_FAILED'
      | 'REGISTRY_INVALID'
      | 'PACKAGE_MISSING',
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
  onProgress?: (event: { stage: string; message?: string }) => void;
  adapters?: IifeBundleLoaderAdapters;
}): Promise<{ pkg: IifePackageExports; meta: LocalBundleMeta }> {
  const bundleTarget = opts.bundleTarget || 'client-player';
  const endpoint = opts.endpoint || '/api/bundle';
  const adapters = opts.adapters ?? configuredAdapters;
  const buildClient = adapters.buildClient ?? defaultBuildClient;
  const registryClient = adapters.registryClient ?? defaultRegistryClient;
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
  const pkg = registry[opts.packageName];
  if (!pkg) {
    throw new IifeBundleLoadError(
      'PACKAGE_MISSING',
      `Package ${opts.packageName} not found in loaded bundle. Available: ${Object.keys(registry).join(', ')}`,
      { packageName: opts.packageName, availablePackages: Object.keys(registry) }
    );
  }

  return { pkg, meta };
}
