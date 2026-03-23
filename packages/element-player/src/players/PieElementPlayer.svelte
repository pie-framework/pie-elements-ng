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
import type { MathRenderer } from '@pie-element/shared-math-rendering-core';
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

let lastAppliedModelRef: any = null;
let lastAppliedSessionRef: any = null;
let lastAppliedRole: string | null = null;

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
    elementInstance.removeEventListener('model.updated', modelHandler);
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
      if (suppressSessionEvents) {
        return;
      }
      event.stopPropagation();
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as any;
      const nextSession = detail?.session ?? (elementInstance as any).session ?? detail;
      if (nextSession === undefined) {
        return;
      }
      session = nextSession;
      lastAppliedSessionRef = nextSession;
      dispatch('session-changed', {
        ...detail,
        session: nextSession,
      });
    };
    elementInstance.addEventListener('session-changed', sessionHandler);
  }

  if (viewMode === 'author') {
    modelHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as any;
      // Many elements emit partial updates in model.updated detail;
      // emit a full model snapshot to keep host state consistent.
      const nextModel = (elementInstance as any)?.model ?? detail?.model ?? detail?.update ?? detail;
      dispatch('model-changed', nextModel);
    };
    elementInstance.addEventListener('model.updated', modelHandler);
  }
}

function applyModel(nextModel: any) {
  if (!elementInstance || nextModel === lastAppliedModelRef) {
    return;
  }
  (elementInstance as any).model = cloneValue(nextModel ?? {});
  lastAppliedModelRef = nextModel;
}

function applySession(nextSession: any) {
  if (!elementInstance || resolvedView !== 'delivery' || nextSession === lastAppliedSessionRef) {
    return;
  }
  if ((elementInstance as any)._model === undefined) {
    (elementInstance as any).model = cloneValue(model ?? {});
  }
  suppressSessionEvents = true;
  try {
    (elementInstance as any).session = nextSession ?? {};
    lastAppliedSessionRef = nextSession;
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
      lastAppliedModelRef = null;
      lastAppliedSessionRef = null;
      lastAppliedRole = null;
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

  if (container && mathRenderer) {
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
