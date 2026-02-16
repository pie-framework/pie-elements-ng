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
  joined?: boolean;
  status?: {
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
  };
}

interface BuildStatusResponse {
  buildId: string;
  hash: string;
  stage: string;
  done: boolean;
  success?: boolean;
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
        // Capture the registry snapshot for this bundle URL. Another route can load
        // a different bundle right after this and overwrite window.pie.
        resolve(resolvePieRegistry());
      } catch (error) {
        scriptLoads.delete(url);
        reject(error);
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

function resolvePieRegistry(): Record<string, IifePackageExports> {
  const pieGlobal = (window as any).pie;
  if (!pieGlobal) {
    throw new Error('window.pie not found after loading IIFE bundle');
  }
  return pieGlobal.default || pieGlobal;
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
  forceRebuild?: boolean;
  clearCache?: boolean;
  bundleTarget?: IifeBundleTarget;
  onProgress?: (event: { stage: string; message?: string }) => void;
}): Promise<{ pkg: IifePackageExports; meta: LocalBundleMeta }> {
  let clientPlayerUrl = '';
  let meta: LocalBundleMeta;
  const bundleTarget = opts.bundleTarget || 'client-player';
  const response = await fetch('/api/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dependencies: [{ name: opts.packageName, version: opts.version }],
      forceRebuild: !!opts.forceRebuild,
      clearCache: !!opts.clearCache,
      wait: false,
    }),
  });

  const startPayload = (await response.json()) as BuildStartResponse;
  if (!response.ok || !startPayload.buildId) {
    throw new Error((startPayload as any).error || 'Local bundle build failed');
  }
  opts.onProgress?.({ stage: 'queued' });
  const payload = await waitForBuildResult(startPayload.buildId, opts.onProgress);
  if (!payload.success) {
    throw new Error(payload.errors?.join('\n') || 'Local bundle build failed');
  }

  clientPlayerUrl = getBundleUrl(payload.bundles, bundleTarget);
  if (opts.forceRebuild && clientPlayerUrl) {
    const separator = clientPlayerUrl.includes('?') ? '&' : '?';
    clientPlayerUrl = `${clientPlayerUrl}${separator}rebuild=${Date.now()}`;
  }
  meta = {
    source: 'local',
    hash: payload.hash,
    duration: payload.duration,
    cached: payload.cached,
    url: clientPlayerUrl,
  };

  if (!clientPlayerUrl) {
    throw new Error('Bundle URL was not returned');
  }

  const registry = await loadScript(clientPlayerUrl);
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
  onProgress?: (event: { stage: string; message?: string }) => void
): Promise<{
  success: boolean;
  bundles?: { player?: string; clientPlayer?: string; editor?: string };
  hash: string;
  duration: number;
  cached?: boolean;
  errors?: string[];
}> {
  try {
    return await waitForBuildWithSse(buildId, onProgress);
  } catch {
    return await waitForBuildWithPolling(buildId, onProgress);
  }
}

function waitForBuildWithSse(
  buildId: string,
  onProgress?: (event: { stage: string; message?: string }) => void
): Promise<{
  success: boolean;
  bundles?: { player?: string; clientPlayer?: string; editor?: string };
  hash: string;
  duration: number;
  cached?: boolean;
  errors?: string[];
}> {
  return new Promise((resolve, reject) => {
    if (typeof EventSource === 'undefined') {
      reject(new Error('EventSource unavailable'));
      return;
    }

    const source = new EventSource(`/api/bundle/events?buildId=${encodeURIComponent(buildId)}`);
    source.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        if (payload.type === 'progress') {
          onProgress?.({ stage: payload.stage, message: payload.message });
          return;
        }
        if (payload.type === 'done') {
          source.close();
          if (payload.result?.success) {
            resolve(payload.result);
          } else {
            reject(
              new Error(payload.error || payload.result?.errors?.join('\n') || 'Build failed')
            );
          }
        }
      } catch (err) {
        source.close();
        reject(err);
      }
    };
    source.onerror = () => {
      source.close();
      reject(new Error('SSE connection failed'));
    };
  });
}

async function waitForBuildWithPolling(
  buildId: string,
  onProgress?: (event: { stage: string; message?: string }) => void
): Promise<{
  success: boolean;
  bundles?: { player?: string; clientPlayer?: string; editor?: string };
  hash: string;
  duration: number;
  cached?: boolean;
  errors?: string[];
}> {
  // Poll fallback for environments where SSE is unavailable or interrupted.
  for (;;) {
    const res = await fetch(`/api/bundle?buildId=${encodeURIComponent(buildId)}`);
    const status = (await res.json()) as BuildStatusResponse;
    if (!res.ok) {
      throw new Error((status as any).error || 'Failed to poll build status');
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
