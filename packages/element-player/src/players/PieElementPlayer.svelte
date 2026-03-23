<svelte:options
  customElement={{
    tag: 'pie-element-player',
    shadow: 'none',
    props: {
      strategy: { reflect: true, type: 'String' },
      view: { reflect: true, type: 'String' },
      mode: { reflect: true, type: 'String' },
      elementName: { reflect: true, type: 'String', attribute: 'element-name' },
      packageName: { reflect: true, type: 'String', attribute: 'package-name' },
      elementVersion: { reflect: true, type: 'String', attribute: 'element-version' },
      role: { reflect: true, type: 'String' },
      cdnUrl: { reflect: true, type: 'String', attribute: 'cdn-url' },
      iifeBundleEndpoint: { reflect: true, type: 'String', attribute: 'iife-bundle-endpoint' },
      preloadedFallbackStrategy: {
        reflect: true,
        type: 'String',
        attribute: 'preloaded-fallback-strategy',
      },
      rebuildVersion: { reflect: false, type: 'Number', attribute: 'rebuild-version' },
      model: { reflect: false, type: 'Object' },
      session: { reflect: false, type: 'Object' },
    },
  }}
/>

<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte';
import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
import type { MathRenderer } from '../lib/math-rendering-types';
import { loadUnifiedPlayer } from '../lib/unified-player-loader';
import {
  normalizeElementPlayerStrategy,
  resolveElementPlayerView,
  type ElementPlayerStrategy,
  type ElementPlayerView,
} from '../lib/player-strategy';

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
  preloadedFallbackStrategy?: ElementPlayerStrategy;
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
  preloadedFallbackStrategy = 'esm',
  rebuildVersion = 0,
  model = $bindable(),
  session = $bindable(),
}: Props = $props();

const dispatch = createEventDispatcher();
let container: HTMLElement;
let elementInstance = $state<HTMLElement | null>(null);
let currentTagName = $state<string | null>(null);
let loading = $state(true);
let error = $state<string | null>(null);
let requestId = 0;

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

let lastAppliedRole: string | null = null;
let lastAppliedModelSignature = '';
let lastAppliedSessionSignature = '';

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

function hasResponseValue(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) {
    return value.some((entry) => hasResponseValue(entry));
  }
  if (typeof value !== 'object') return false;
  if ('value' in (value as Record<string, unknown>)) return true;
  return Object.values(value as Record<string, unknown>).some((nested) => hasResponseValue(nested));
}

function hasExplicitResponseField(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) {
    return value.some((entry) => hasExplicitResponseField(entry));
  }
  if (typeof value !== 'object') return false;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'value') return true;
    if (hasExplicitResponseField(nested)) return true;
  }
  return false;
}

function hasUsableSessionPayload(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const detailObj = value as Record<string, unknown>;
  if ('session' in detailObj) {
    return true;
  }
  return hasResponseValue(detailObj) || hasExplicitResponseField(detailObj);
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
      const nextSession = detail?.session ?? liveSession;

      if (nextSession === undefined) {
        event.stopPropagation();
        return;
      }
      if (!hasUsableDetail && liveSession === undefined) {
        event.stopPropagation();
        return;
      }
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
      session = nextSession;
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
  if ((elementInstance as any)._model === undefined) {
    if (model === null || model === undefined) {
      return;
    }
    (elementInstance as any).model = cloneValue(model ?? {});
  }
  suppressSessionEvents = true;
  try {
    (elementInstance as any).session = nextSession ?? {};
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
  loading = true;
  error = null;

  try {
    const loaded = await loadUnifiedPlayer({
      strategy: resolvedStrategy,
      view: resolvedView,
      elementName,
      packageName: resolvedPackageName,
      elementVersion,
      cdnUrl,
      iifeBundleEndpoint,
      preloadedFallbackStrategy,
      rebuildVersion,
    });

    if (currentRequestId !== requestId) {
      return;
    }

    if (loaded.bundleMeta) {
      dispatch('bundle-meta', loaded.bundleMeta);
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

    if (container && elementInstance.parentElement !== container) {
      container.innerHTML = '';
      container.appendChild(elementInstance);
    }

    dispatch('build-state', { loading: false, error: null, stage: 'completed' });
    dispatch('load-complete', {
      strategy: loaded.strategy,
      view: loaded.view,
      tagName: loaded.tagName,
    });
    loading = false;
  } catch (err) {
    if (currentRequestId !== requestId) {
      return;
    }
    error = err instanceof Error ? err.message : String(err);
    loading = false;
    dispatch('build-state', { loading: false, error, stage: 'error' });
    dispatch('player-error', { error, strategy: resolvedStrategy, view: resolvedView });
  }
}

$effect(() => {
  const key = [
    elementName,
    resolvedPackageName,
    elementVersion,
    resolvedStrategy,
    resolvedView,
    cdnUrl,
    iifeBundleEndpoint,
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
    detachInstanceHandlers();
  };
});
</script>

<div bind:this={container} class="demo-element-player element-player-host">
  {#if loading}
    <div class="loading">Loading {elementName} ({resolvedStrategy}/{resolvedView})...</div>
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

  .loading {
    padding: 2rem;
    text-align: center;
    color: hsl(var(--bc) / 0.6);
    font-style: italic;
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
