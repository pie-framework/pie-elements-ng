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

function resolvePieRegistry(): Record<string, IifePackageExports> {
  const pieGlobal = (window as any).pie;
  if (!pieGlobal) {
    throw new Error('window.pie not found after loading IIFE bundle');
  }
  return pieGlobal.default || pieGlobal;
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
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    script.onerror = () => {
      scriptLoads.delete(url);
      reject(new Error(`Failed to load IIFE bundle: ${url}`));
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

export async function loadIifePackage(opts: {
  packageName: string;
  version: string;
  endpoint?: string;
  forceRebuild?: boolean;
  clearCache?: boolean;
  bundleTarget?: IifeBundleTarget;
  onProgress?: (event: { stage: string; message?: string }) => void;
}): Promise<{ pkg: IifePackageExports; meta: LocalBundleMeta }> {
  const bundleTarget = opts.bundleTarget || 'client-player';
  const endpoint = opts.endpoint || '/api/bundle';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dependencies: [{ name: opts.packageName, version: opts.version }],
      requestedBundles:
        bundleTarget === 'editor'
          ? ['editor']
          : bundleTarget === 'player'
            ? ['player']
            : ['client-player'],
      forceRebuild: !!opts.forceRebuild,
      clearCache: !!opts.clearCache,
      wait: false,
    }),
  });

  const startPayload = (await response.json()) as BuildStartResponse & { error?: string };
  if (!response.ok || !startPayload.buildId) {
    throw new Error(startPayload.error || 'Local bundle build failed');
  }

  opts.onProgress?.({ stage: 'queued' });
  const payload = await waitForBuildResult(startPayload.buildId, endpoint, opts.onProgress);
  if (!payload.success) {
    throw new Error(payload.errors?.join('\n') || 'Local bundle build failed');
  }

  let bundleUrl = getBundleUrl(payload.bundles, bundleTarget);
  if (!bundleUrl) {
    throw new Error('Bundle URL was not returned');
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

  const registry = await loadScript(bundleUrl);
  const pkg = registry[opts.packageName];
  if (!pkg) {
    throw new Error(
      `Package ${opts.packageName} not found in loaded bundle. Available: ${Object.keys(registry).join(', ')}`
    );
  }

  return { pkg, meta };
}

async function waitForBuildResult(
  buildId: string,
  endpoint: string,
  onProgress?: (event: { stage: string; message?: string }) => void
): Promise<{
  success: boolean;
  bundles?: { player?: string; clientPlayer?: string; editor?: string };
  hash: string;
  duration: number;
  cached?: boolean;
  errors?: string[];
}> {
  for (;;) {
    const res = await fetch(`${endpoint}?buildId=${encodeURIComponent(buildId)}`);
    const status = (await res.json()) as BuildStatusResponse;
    if (!res.ok) {
      throw new Error(status.error || 'Failed to poll build status');
    }
    onProgress?.({ stage: status.stage });
    if (status.done) {
      if (status.result?.success) {
        return status.result;
      }
      throw new Error(status.error || status.result?.errors?.join('\n') || 'Build failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
