<svelte:options
  customElement={{
    tag: "pie-element-player",
    shadow: "none",
    props: {
      strategy: { reflect: true, type: "String" },
      view: { reflect: true, type: "String" },
      mode: { reflect: true, type: "String" },
      elementName: { reflect: true, type: "String", attribute: "element-name" },
      packageName: { reflect: true, type: "String", attribute: "package-name" },
      elementVersion: {
        reflect: true,
        type: "String",
        attribute: "element-version",
      },
      role: { reflect: true, type: "String" },
      cdnUrl: { reflect: true, type: "String", attribute: "cdn-url" },
      iifeBundleEndpoint: {
        reflect: true,
        type: "String",
        attribute: "iife-bundle-endpoint",
      },
      iifeBundleHost: {
        reflect: true,
        type: "String",
        attribute: "iife-bundle-host",
      },
      iifeBundleRetry: { reflect: false, type: "Object" },
      preloadedFallbackStrategy: {
        reflect: true,
        type: "String",
        attribute: "preloaded-fallback-strategy",
      },
      runtimeSupportCheck: {
        reflect: true,
        type: "String",
        attribute: "runtime-support-check",
      },
      rebuildVersion: {
        reflect: false,
        type: "Number",
        attribute: "rebuild-version",
      },
      model: { reflect: false, type: "Object" },
      session: { reflect: false, type: "Object" },
    },
  }}
/>

<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte';
import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
import type { MathRenderer } from '../lib/math-rendering-types';
import { loadUnifiedPlayer } from '../lib/unified-player-loader';
import {
  DEFAULT_IIFE_BUNDLE_RETRY_CONFIG,
  type IifeBundleRetryConfig,
  type IifeBundleRetryStatus,
} from '../lib/iife-bundle-loader';
import {
  normalizeElementPlayerStrategy,
  resolveElementPlayerView,
  type ElementPlayerStrategy,
  type ElementPlayerView,
} from '../lib/player-strategy';
import type { RuntimeSupportCheck } from '../lib/runtime-support';

interface Props {
  strategy?: ElementPlayerStrategy;
  view?: ElementPlayerView;
  mode?: string;
  elementName?: string;
  packageName?: string;
  elementVersion?: string;
  role?: 'student' | 'instructor';
  cdnUrl?: string;
  iifeBundleEndpoint?: string;
  iifeBundleHost?: string;
  iifeBundleRetry?: IifeBundleRetryConfig;
  preloadedFallbackStrategy?: ElementPlayerStrategy;
  runtimeSupportCheck?: RuntimeSupportCheck;
  rebuildVersion?: number;
  model?: any;
  session?: any;
}

let {
  strategy = 'esm',
  view = 'delivery',
  mode = '',
  elementName = '',
  packageName = '',
  elementVersion = 'latest',
  role = 'student',
  cdnUrl = '',
  iifeBundleEndpoint = '/api/bundle',
  iifeBundleHost = '',
  iifeBundleRetry = DEFAULT_IIFE_BUNDLE_RETRY_CONFIG,
  preloadedFallbackStrategy = 'esm',
  runtimeSupportCheck = 'off',
  rebuildVersion = 0,
  model = $bindable(),
  session = $bindable(),
}: Props = $props();

const dispatch = createEventDispatcher();
let container: HTMLElement;
let elementMount: HTMLElement;
let elementInstance = $state<HTMLElement | null>(null);
let currentTagName = $state<string | null>(null);
let loading = $state(true);
let error = $state<string | null>(null);
let iifeRetryStatus = $state<IifeBundleRetryStatus | null>(null);
let requestId = 0;
let activeLoadAbortController: AbortController | null = null;

let mathRenderer: MathRenderer | null = null;
let mathObserver: MutationObserver | null = null;
let renderTimeout: number | null = null;
let renderInFlight = false;
let renderQueued = false;
let sessionHandler: ((e: Event) => void) | null = null;
let modelHandler: ((e: Event) => void) | null = null;
let suppressSessionEvents = false;
let isForwardingSessionEvent = false;
let lastForwardedSessionDetailSignature = '';
let lastForwardedSessionSignature = '';
const metadataOnlySessionKeys = new Set(['complete', 'component']);

let lastAppliedRole: string | null = null;
let lastAppliedModelSignature = '';
let lastAppliedSessionSignature = '';

const iifeBuildWarning = $derived.by(() => {
  if (iifeRetryStatus?.state !== 'retrying') return null;
  const elapsedSeconds = Math.max(1, Math.ceil(iifeRetryStatus.elapsedMs / 1000));
  const timeoutSeconds = Math.max(1, Math.ceil(iifeRetryStatus.timeoutMs / 1000));
  return `Bundle is still building. Retrying attempt ${iifeRetryStatus.attempt} (${elapsedSeconds}s of ${timeoutSeconds}s).`;
});

function isLoadAbortedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === 'LOAD_ABORTED' ||
    (typeof maybeError.message === 'string' && maybeError.message.includes('aborted'))
  );
}

const resolvedStrategy = $derived(normalizeElementPlayerStrategy(strategy, 'esm'));
const resolvedView = $derived(resolveElementPlayerView({ mode, view }, 'delivery'));
const resolvedPackageName = $derived(
  packageName || (elementName ? `@pie-element/${elementName}` : '')
);

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      return value;
    }
  }
}

function createValueSignature(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? '__undefined__' : serialized;
  } catch {
    return `__unserializable__:${String(value)}`;
  }
}

function hasUsableSessionPayload(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const detailObj = value as Record<string, unknown>;
  if ('session' in detailObj) {
    return true;
  }
  const keys = Object.keys(detailObj);
  if (keys.length === 0) {
    return false;
  }
  return !keys.every((key) => metadataOnlySessionKeys.has(key));
}

function reconnectMathObserver() {
  if (mathObserver && container) {
    mathObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }
}

async function renderMathSafely() {
  if (!mathRenderer || !container) {
    return;
  }
  if (renderInFlight) {
    renderQueued = true;
    return;
  }
  renderInFlight = true;
  if (mathObserver) {
    mathObserver.disconnect();
  }
  try {
    await mathRenderer(container);
  } catch (err) {
    console.error('[pie-element-player] Math rendering error:', err);
  } finally {
    renderInFlight = false;
    reconnectMathObserver();
    if (renderQueued) {
      renderQueued = false;
      queueMicrotask(() => void renderMathSafely());
    }
  }
}

function detachInstanceHandlers() {
  if (!elementInstance) {
    return;
  }
  if (sessionHandler) {
    elementInstance.removeEventListener('session-changed', sessionHandler);
    sessionHandler = null;
  }
  if (modelHandler) {
    elementInstance.removeEventListener('model.updated', modelHandler, true);
    modelHandler = null;
  }
}

function attachInstanceHandlers(viewMode: ElementPlayerView) {
  if (!elementInstance) {
    return;
  }
  detachInstanceHandlers();
  if (viewMode === 'delivery') {
    sessionHandler = (event: Event) => {
      if (suppressSessionEvents || isForwardingSessionEvent) {
        event.stopPropagation();
        return;
      }
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as any;
      const detailObj =
        detail && typeof detail === 'object' ? (detail as Record<string, unknown>) : null;
      const hasUsableDetail = hasUsableSessionPayload(detailObj);
      const liveSession = (elementInstance as any)?.session;
      const nextSessionRaw = detail?.session ?? liveSession ?? session;

      if (nextSessionRaw === undefined) {
        event.stopPropagation();
        return;
      }
      if (!hasUsableDetail && nextSessionRaw === undefined) {
        event.stopPropagation();
        return;
      }
      const nextSession = cloneValue(nextSessionRaw ?? {});
      const sessionSignature = createValueSignature(nextSession);
      if (sessionSignature === lastForwardedSessionSignature) {
        event.stopPropagation();
        return;
      }
      const forwardedDetail = {
        ...(detailObj ?? {}),
        session: nextSession,
      };
      const detailSignature = createValueSignature(forwardedDetail);
      if (detailSignature === lastForwardedSessionDetailSignature) {
        event.stopPropagation();
        return;
      }
      lastForwardedSessionDetailSignature = detailSignature;
      lastForwardedSessionSignature = sessionSignature;

      event.stopPropagation();
      isForwardingSessionEvent = true;
      session = cloneValue(nextSession);
      lastAppliedSessionSignature = createValueSignature(nextSession);
      try {
        dispatch('session-changed', forwardedDetail);
      } finally {
        setTimeout(() => {
          isForwardingSessionEvent = false;
        }, 0);
      }
    };
    elementInstance.addEventListener('session-changed', sessionHandler);
  }

  if (viewMode === 'author') {
    modelHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as any;
      const currentModel = (elementInstance as any)?.model ?? model;
      let nextModel = (elementInstance as any)?.model ?? detail?.model ?? detail?.update ?? detail;
      // Many elements emit partial updates in model.updated detail.
      // Merge with the latest known model so hosts receive a full snapshot.
      if (
        detail?.update &&
        typeof detail.update === 'object' &&
        currentModel &&
        typeof currentModel === 'object'
      ) {
        nextModel = { ...currentModel, ...detail.update };
      }
      dispatch('model-changed', nextModel);
    };
    elementInstance.addEventListener('model.updated', modelHandler, true);
  }
}

function applyModel(nextModel: any) {
  if (!elementInstance) {
    return;
  }
  if (nextModel === null || nextModel === undefined) {
    return;
  }
  const nextSignature = createValueSignature(nextModel ?? {});
  if (nextSignature === lastAppliedModelSignature) {
    return;
  }
  (elementInstance as any).model = cloneValue(nextModel ?? {});
  lastAppliedModelSignature = nextSignature;
}

function applySession(nextSession: any) {
  if (!elementInstance || resolvedView !== 'delivery') {
    return;
  }
  if (nextSession === null || nextSession === undefined) {
    return;
  }
  const nextSignature = createValueSignature(nextSession ?? {});
  if (nextSignature === lastAppliedSessionSignature) {
    return;
  }
  suppressSessionEvents = true;
  try {
    (elementInstance as any).session = cloneValue(nextSession ?? {});
    lastAppliedSessionSignature = nextSignature;
  } finally {
    suppressSessionEvents = false;
  }
}

function applyRole(nextRole: 'student' | 'instructor') {
  if (!elementInstance || resolvedView !== 'print' || nextRole === lastAppliedRole) {
    return;
  }
  (elementInstance as any).role = nextRole;
  (elementInstance as any).options = { role: nextRole };
  lastAppliedRole = nextRole;
}

async function ensureLoaded() {
  if (!elementName || !resolvedPackageName) {
    loading = false;
    error = 'Missing required element metadata';
    return;
  }
  const currentRequestId = ++requestId;
  if (activeLoadAbortController) {
    activeLoadAbortController.abort();
    dispatch('build-state', {
      loading: false,
      error: null,
      stage: 'cancelled',
      strategy: resolvedStrategy,
      view: resolvedView,
      retry: {
        state: 'cancelled',
        stage: 'build-status',
        attempt: 0,
        elapsedMs: 0,
        timeoutMs: iifeBundleRetry?.timeoutMs ?? DEFAULT_IIFE_BUNDLE_RETRY_CONFIG.timeoutMs,
        reason: 'superseded by new load request',
      },
    });
    dispatch('load-cancelled', {
      reason: 'superseded by new load request',
      strategy: resolvedStrategy,
      view: resolvedView,
    });
  }
  const requestAbortController = new AbortController();
  activeLoadAbortController = requestAbortController;
  loading = true;
  error = null;
  iifeRetryStatus = null;

  try {
    const loaded = await loadUnifiedPlayer({
      strategy: resolvedStrategy,
      view: resolvedView,
      elementName,
      packageName: resolvedPackageName,
      elementVersion,
      cdnUrl,
      iifeBundleEndpoint,
      iifeBundleHost,
      iifeBundleRetry,
      signal: requestAbortController.signal,
      runtimeSupportCheck,
      onIifeBundleRetryStatus: (status) => {
        if (currentRequestId !== requestId) {
          return;
        }
        iifeRetryStatus = status;
        dispatch('bundle-retry-status', status);
        const loadingState = status.state === 'retrying';
        const detail = {
          loading: loadingState,
          error: null,
          stage: status.state,
          strategy: resolvedStrategy,
          view: resolvedView,
          retry: status,
        };
        dispatch('build-state', detail);
      },
      preloadedFallbackStrategy,
      rebuildVersion,
    });

    if (currentRequestId !== requestId) {
      return;
    }

    if (loaded.bundleMeta) {
      dispatch('bundle-meta', loaded.bundleMeta);
    }
    if (loaded.controllerDiagnostic) {
      dispatch('controller-load', loaded.controllerDiagnostic);
    }
    if (loaded.controller && loaded.view === 'delivery' && loaded.strategy === 'iife') {
      dispatch('controller-changed', loaded.controller);
    }

    if (!elementInstance || currentTagName !== loaded.tagName) {
      detachInstanceHandlers();
      if (elementInstance) {
        elementInstance.remove();
      }
      elementInstance = document.createElement(loaded.tagName);
      currentTagName = loaded.tagName;
      lastAppliedRole = null;
      lastAppliedModelSignature = '';
      lastAppliedSessionSignature = '';
      lastForwardedSessionDetailSignature = '';
      lastForwardedSessionSignature = '';
    }

    attachInstanceHandlers(loaded.view);
    applyModel(model);
    applySession(session);
    applyRole(role);

    if (elementMount && elementInstance.parentElement !== elementMount) {
      elementMount.replaceChildren(elementInstance);
    }

    dispatch('build-state', {
      loading: false,
      error: null,
      stage: 'completed',
    });
    dispatch('load-complete', {
      strategy: loaded.strategy,
      view: loaded.view,
      tagName: loaded.tagName,
    });
    loading = false;
    iifeRetryStatus = null;
    if (activeLoadAbortController === requestAbortController) {
      activeLoadAbortController = null;
    }
  } catch (err) {
    if (currentRequestId !== requestId) {
      return;
    }
    if (isLoadAbortedError(err) || requestAbortController.signal.aborted) {
      const existingRetry = iifeRetryStatus as IifeBundleRetryStatus | null;
      const retry: IifeBundleRetryStatus =
        existingRetry?.state === 'cancelled'
          ? existingRetry
          : {
              state: 'cancelled',
              stage: 'build-status',
              attempt: 0,
              elapsedMs: 0,
              timeoutMs: iifeBundleRetry?.timeoutMs ?? DEFAULT_IIFE_BUNDLE_RETRY_CONFIG.timeoutMs,
              reason: err instanceof Error ? err.message : String(err),
            };
      error = null;
      loading = false;
      iifeRetryStatus = retry;
      dispatch('bundle-retry-status', retry);
      dispatch('build-state', {
        loading: false,
        error: null,
        stage: 'cancelled',
        strategy: resolvedStrategy,
        view: resolvedView,
        retry,
      });
      dispatch('load-cancelled', {
        reason: retry.reason || 'load cancelled',
        strategy: resolvedStrategy,
        view: resolvedView,
      });
      if (activeLoadAbortController === requestAbortController) {
        activeLoadAbortController = null;
      }
      return;
    }
    error = err instanceof Error ? err.message : String(err);
    loading = false;
    const existingRetry = iifeRetryStatus as IifeBundleRetryStatus | null;
    const terminalRetry =
      existingRetry && (existingRetry.state === 'timeout' || existingRetry.state === 'completed')
        ? existingRetry
        : undefined;
    dispatch('build-state', {
      loading: false,
      error,
      stage: 'error',
      strategy: resolvedStrategy,
      view: resolvedView,
      retry: terminalRetry,
    });
    dispatch('player-error', {
      error,
      strategy: resolvedStrategy,
      view: resolvedView,
      retry: terminalRetry,
    });
    if (activeLoadAbortController === requestAbortController) {
      activeLoadAbortController = null;
    }
  }
}

$effect(() => {
  const key = [
    elementName,
    resolvedPackageName,
    elementVersion,
    resolvedStrategy,
    resolvedView,
    runtimeSupportCheck,
    cdnUrl,
    iifeBundleEndpoint,
    iifeBundleHost,
    JSON.stringify(iifeBundleRetry || DEFAULT_IIFE_BUNDLE_RETRY_CONFIG),
    preloadedFallbackStrategy,
    rebuildVersion,
  ].join('|');
  key;
  ensureLoaded();
});

$effect(() => {
  if (!elementInstance) {
    return;
  }
  applyModel(model);
  applySession(session);
  applyRole(role);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void renderMathSafely();
    });
  });
});

onMount(() => {
  mathRenderer = createMathjaxRenderer();
  if (typeof window !== 'undefined') {
    (window as any)['@pie-lib/math-rendering'] = { renderMath: mathRenderer };
  }
  if (mathRenderer && typeof window !== 'undefined') {
    void mathRenderer(document.createElement('div'));
  }

  if (container) {
    mathObserver = new MutationObserver(() => {
      if (renderTimeout) {
        clearTimeout(renderTimeout);
      }
      renderTimeout = window.setTimeout(() => {
        void renderMathSafely();
      }, 100);
    });
    reconnectMathObserver();
    void renderMathSafely();
  }

  return () => {
    if (renderTimeout) {
      clearTimeout(renderTimeout);
      renderTimeout = null;
    }
    if (mathObserver) {
      mathObserver.disconnect();
      mathObserver = null;
    }
    if (elementMount) {
      elementMount.replaceChildren();
    }
    activeLoadAbortController?.abort();
    activeLoadAbortController = null;
    detachInstanceHandlers();
  };
});
</script>

<div bind:this={container} class="demo-element-player element-player-host">
  <div bind:this={elementMount} class="element-player-mount"></div>
  {#if loading}
    <div class="loading">
      Loading {elementName} ({resolvedStrategy}/{resolvedView})...
      {#if iifeBuildWarning}
        <div class="loading-warning" role="status" aria-live="polite" aria-atomic="true">
          {iifeBuildWarning}
        </div>
      {/if}
    </div>
  {/if}
  {#if error}
    <div class="error">
      <strong>Element player error:</strong>
      <pre>{error}</pre>
    </div>
  {/if}
</div>

<style>
  .element-player-host {
    width: 100%;
    min-height: 100px;
  }

  .element-player-mount {
    width: 100%;
  }

  .loading {
    padding: 2rem;
    text-align: center;
    color: hsl(var(--bc) / 0.6);
    font-style: italic;
  }

  .loading-warning {
    margin-top: 0.5rem;
    color: #9a6700;
    font-style: normal;
  }

  .error {
    padding: 1rem;
    background: hsl(var(--er) / 0.1);
    border: 1px solid hsl(var(--er) / 0.3);
    border-radius: 4px;
    color: hsl(var(--er));
  }

  .error pre {
    margin: 0.5rem 0 0;
    padding: 0.5rem;
    background: #fff;
    border-radius: 4px;
    font-size: 0.875rem;
    overflow-x: auto;
  }
</style>
