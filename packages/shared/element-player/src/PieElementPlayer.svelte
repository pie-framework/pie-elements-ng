<svelte:options
  customElement={{
    tag: 'pie-element-player',
    shadow: 'none',
    props: {
      elementName: { attribute: 'element-name', type: 'String' },
      cdnUrl: { attribute: 'cdn-url', type: 'String' },
      model: { attribute: 'model', type: 'Object' },
      session: { attribute: 'session', type: 'Object' },
      mode: { attribute: 'mode', type: 'String' },
      showConfigure: { attribute: 'show-configure', type: 'Boolean' },
      hosted: { attribute: 'hosted', type: 'Boolean' },
      playerRole: { attribute: 'player-role', type: 'String' },
      partialScoring: { attribute: 'partial-scoring', type: 'Boolean' },
      addCorrectResponse: { attribute: 'add-correct-response', type: 'Boolean' },
      debug: { attribute: 'debug', type: 'Boolean' }
    }
  }}
/>

<script lang="ts">
/**
 * PIE Element Player Web Component
 *
 * A custom element that loads and renders PIE elements dynamically,
 * with support for mode switching, session management, and controller integration.
 */

import { onMount, onDestroy } from 'svelte';
import ModeSelector from './components/ModeSelector.svelte';
import SessionPanel from './components/SessionPanel.svelte';
import ScoringPanel from './components/ScoringPanel.svelte';
import ModelPanel from './components/ModelPanel.svelte';
import Tabs from './components/Tabs.svelte';
import { loadElement, loadController } from './lib/element-loader';
import type { PieController } from './lib/types';
import { createKatexRenderer } from '@pie-element/math-typesetting';
import type { MathRenderer } from '@pie-element/math-typesetting';

// Props with Svelte 5 runes
let {
  elementName = '',
  cdnUrl = '',
  model = $bindable({}),
  session = $bindable({}),
  mode = $bindable('gather'),
  showConfigure = false,
  mathRenderer = $bindable<MathRenderer>(createKatexRenderer()),
  hosted = $bindable(false),
  playerRole = $bindable<'student' | 'instructor'>('student'),
  partialScoring = $bindable(true),
  addCorrectResponse = $bindable(false),
  debug = false,
}: {
  elementName?: string;
  cdnUrl?: string;
  model?: any;
  session?: any;
  mode?: 'gather' | 'view' | 'evaluate';
  showConfigure?: boolean;
  mathRenderer?: MathRenderer;
  hosted?: boolean;
  playerRole?: 'student' | 'instructor';
  partialScoring?: boolean;
  addCorrectResponse?: boolean;
  debug?: boolean;
} = $props();

// State
let loading = $state(true);
let error = $state<string | null>(null);
let activeTab = $state('delivery');
let score = $state<any>(null);
let controller = $state<PieController | null>(null);
let hasConfigure = $state(false);
let configureWarning = $state<string | null>(null);
let controllerWarning = $state<string | null>(null);
let elementModel = $state<any>({});
let modelError = $state<string | null>(null);
let splitRatio = $state(50);
let sessionVersion = $state(0);
let modelVersion = $state(0);
let lastSessionRef = session;
let lastElementModelRef = elementModel;
let lastElementSessionRef = session;
let roleLocked = $state(false);

const logConsole = (label: string, data?: any) => {
  console.log('[pie-element-player]', label, data ?? '');
};

const normalizeSession = (nextSession: any) => {
  const normalized = nextSession && typeof nextSession === 'object' ? nextSession : {};
  if ((normalized as any).value === undefined) {
    (normalized as any).value = [];
  }
  return normalized;
};

const setSession = (nextSession: any, source: string) => {
  const normalized = normalizeSession(nextSession);
  if (normalized === session) {
    return;
  }
  session = normalized;
  sessionVersion += 1;
  logConsole(source, normalized);
};

const applySessionUpdate = (patch: Record<string, unknown> | null | undefined) => {
  if (!patch || typeof patch !== 'object') {
    return Promise.resolve(session);
  }

  const baseSession = normalizeSession(session);
  const hasChanges = Object.entries(patch).some(
    ([key, value]) => (baseSession as Record<string, unknown>)[key] !== value
  );
  if (!hasChanges) {
    return Promise.resolve(session);
  }

  const nextSession = { ...(baseSession as Record<string, unknown>), ...patch };
  setSession(nextSession, 'session:update');
  return Promise.resolve(session);
};

$effect(() => {
  roleLocked = mode === 'evaluate';
  if (playerRole !== 'instructor' && mode === 'evaluate') {
    mode = 'view';
  }
});

$effect(() => {
  if (session && session !== lastSessionRef) {
    lastSessionRef = session;
    const normalized = normalizeSession(session);
    if (normalized !== session) {
      session = normalized;
    }
    sessionVersion += 1;
    logConsole('session:prop', normalized);
  }
});

$effect(() => {
  if (!elementPlayer) return;

  if (elementModel && elementModel !== lastElementModelRef) {
    lastElementModelRef = elementModel;
    try {
      (elementPlayer as any).model = elementModel;
      logConsole('element:model:set', { prompt: elementModel?.prompt });
    } catch (err) {
      console.error('[pie-element-player] Error setting element model:', err);
    }
  }

  // Check if session content has changed (not just reference)
  if (session) {
    const sessionChanged = JSON.stringify(session) !== JSON.stringify(lastElementSessionRef);
    if (sessionChanged) {
      lastElementSessionRef = session;
      try {
        (elementPlayer as any).session = session;
        logConsole('element:session:set', { value: session?.value });
      } catch (err) {
        console.error('[pie-element-player] Error setting element session:', err);
      }
    }
  }
});

$effect(() => {
  logConsole('mode:changed', mode);
});

$effect(() => {
  logConsole('role:changed', playerRole);
});

// DOM references
let elementPlayer = $state<HTMLElement | null>(null);
let configureContainer = $state<HTMLDivElement | null>(null);
let configureInstance: HTMLElement | null = null;

// Derived values
const configureTag = $derived(`${elementName}-configure`);

/**
 * Initialize the element player
 * Loads the element, controller, and optionally configure component
 */
const handleWindowError = (event: ErrorEvent) => {
  console.error(
    '[pie-element-player] window:error',
    event.message || event.error || 'Unknown error'
  );
};
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error(
    '[pie-element-player] window:unhandledrejection',
    event.reason || 'Unknown rejection'
  );
};

onMount(async () => {
  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  try {
    if (!elementName) {
      throw new Error('element-name attribute is required');
    }

    const packageName = `@pie-element/${elementName}`;

    if (debug) console.log(`[pie-element-player] Loading element: ${elementName}`);

    // Try to load controller (unless hosted)
    if (!hosted) {
      try {
        const ctrl = await loadController(packageName, cdnUrl, debug);
        controller = ctrl;
      } catch (e) {
        controllerWarning = `Controller not available for "${elementName}".`;
        console.warn(
          `[pie-element-player] Controller not available for ${elementName} (continuing without controller)`
        );
      }
    } else if (debug) {
      console.log(`[pie-element-player] hosted=true, skipping controller load`);
    }

    // Try to load configure if requested (silently fail if not available)
    if (showConfigure) {
      try {
        await loadElement(`${packageName}/configure`, configureTag, cdnUrl, debug, true);
        if (customElements.get(configureTag)) {
          hasConfigure = true;
          if (debug) console.log(`[pie-element-player] Configure component loaded`);
        } else {
          configureWarning = `Configure component not available for "${elementName}".`;
          console.warn(
            `[pie-element-player] Configure not available for ${elementName} (continuing without configure)`
          );
        }
      } catch (e) {
        configureWarning = `Configure component not available for "${elementName}".`;
        console.warn(
          `[pie-element-player] Configure not available for ${elementName} (continuing without configure)`
        );
      }
    }

    loading = false;

    // Wait for next tick to ensure DOM containers are rendered
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Create configure instance if available
    if (hasConfigure && configureContainer) {
      configureInstance = document.createElement(configureTag);
      configureInstance.addEventListener('model-changed', handleModelChange as EventListener);
      configureContainer.appendChild(configureInstance);

      // Set initial model immediately
      if (model) {
        (configureInstance as any).model = model;
        if (debug) console.log(`[pie-element-player] Set initial configure model:`, model);
      }
    }

    if (debug) console.log(`[pie-element-player] ✓ Element player initialized for ${elementName}`);
  } catch (err: any) {
    error = err.message;
    loading = false;
    console.error(`[pie-element-player] Error initializing:`, err);
  }
});

/**
 * Cleanup on component destroy
 */
onDestroy(() => {
  window.removeEventListener('error', handleWindowError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  if (configureInstance) {
    configureInstance.removeEventListener('model-changed', handleModelChange as EventListener);
    configureInstance.remove();
  }
});

// Build the view model using the controller when available
let modelRequestId = 0;
const buildModel = async (
  requestId: number,
  currentSessionVersion: number,
  currentModelVersion: number
) => {
  const currentMode = mode;
  const currentRole = playerRole;
  const currentPartialScoring = partialScoring;
  logConsole('model:build:request', {
    requestId,
    modelVersion: currentModelVersion,
    sessionVersion: currentSessionVersion,
    mode: currentMode,
    role: currentRole,
  });

  if (!model) {
    elementModel = {};
    modelError = null;
    logConsole('model:clear');
    return;
  }

  const modelFn = controller?.model;
  if (hosted) {
    elementModel = { ...model, mode: currentMode };
    modelError = null;
    logConsole('model:hosted', { mode: currentMode });
    return;
  }

  if (!modelFn || typeof modelFn !== 'function') {
    elementModel = {};
    modelError = 'Controller model() is required to filter client-visible data.';
    logConsole('model:error', modelError);
    return;
  }

  try {
    logConsole('model:build:start', {
      mode: currentMode,
      role: currentRole,
      partialScoring: currentPartialScoring,
      sessionVersion: currentSessionVersion,
      modelVersion: currentModelVersion,
    });
    let modelSession = normalizeSession(session);
    const correctResponseSession =
      addCorrectResponse &&
      controller &&
      typeof controller.createCorrectResponseSession === 'function'
        ? await controller.createCorrectResponseSession(model, {
            mode: currentMode,
            role: 'instructor',
            partialScoring: currentPartialScoring,
          })
        : null;
    if (correctResponseSession) {
      modelSession = correctResponseSession;
      setSession(correctResponseSession, 'session:correct');
    }

    const nextModel = await (modelFn as any)(
      model,
      modelSession,
      { mode: currentMode, role: currentRole, partialScoring: currentPartialScoring },
      applySessionUpdate
    );
    if (requestId === modelRequestId) {
      const normalizedModel = {
        ...nextModel,
        mode: currentMode,
      };
      elementModel = { ...normalizedModel };
      modelError = null;
      logConsole('model:build:success', {
        responseCorrect: normalizedModel?.responseCorrect,
        mode: currentMode,
        role: currentRole,
        sessionValue: session?.value,
      });
    }
  } catch (err) {
    console.error('[pie-element-player] Controller model error:', err);
    if (requestId === modelRequestId) {
      elementModel = { ...model, mode };
      modelError = err instanceof Error ? err.message : 'Failed to build model';
      logConsole('model:build:error', modelError);
    }
  }
};

$effect(() => {
  // Read reactive dependencies explicitly to ensure effect re-runs on changes
  const currentMode = mode;
  const currentRole = playerRole;
  const currentPartialScoring = partialScoring;
  const currentAddCorrectResponse = addCorrectResponse;

  modelRequestId += 1;
  const requestId = modelRequestId;
  const currentSessionVersion = sessionVersion;
  const currentModelVersion = modelVersion;
  buildModel(requestId, currentSessionVersion, currentModelVersion);
});

/**
 * Render math when element content changes
 */
$effect(() => {
  if (elementPlayer && mathRenderer && !loading) {
    try {
      // Call math renderer on the container to process all math elements
      mathRenderer(elementPlayer);

      if (debug) {
        console.log(`[pie-element-player] Math rendering applied`);
      }
    } catch (err) {
      console.error(`[pie-element-player] Math rendering error:`, err);
    }
  }
});

/**
 * Update configure properties when model changes
 */
$effect(() => {
  if (configureInstance && model) {
    try {
      (configureInstance as any).model = model;
    } catch (err) {
      console.error(`[pie-element-player] Error updating configure properties:`, err);
    }
  }
});

/**
 * Call controller in evaluate mode
 */
$effect(() => {
  if (mode === 'evaluate' && controller && model && session) {
    if (debug) console.log(`[pie-element-player] Calling controller.score()`);

    // Try score method first, fall back to outcome
    const scoreMethod = controller.score || controller.outcome;

    if (scoreMethod) {
      logConsole('outcome:start', { mode, role: playerRole, partialScoring });
      scoreMethod(model, session, { mode, role: playerRole, partialScoring })
        .then((result: any) => {
          score = result;
          if (debug) console.log(`[pie-element-player] Score result:`, result);
          logConsole('outcome:success', result);
        })
        .catch((err: any) => {
          console.error(`[pie-element-player] Scoring error:`, err);
          if (debug) score = { error: err.message };
          logConsole('outcome:error', err instanceof Error ? err.message : err);
        });
    } else {
      console.warn(`[pie-element-player] Controller has no score or outcome method`);
      logConsole('outcome:missing');
    }
  } else {
    score = null;
  }
});

/**
 * Handle session-changed event from element
 */
function handleSessionChange(event: CustomEvent) {
  if (debug) console.log(`[pie-element-player] Session changed:`, event.detail);
  const detail = event.detail as any;
  if (detail?.session) {
    setSession(detail.session, 'session:changed');
    lastElementSessionRef = session;
    return;
  }
  if (elementPlayer && (elementPlayer as any).session) {
    setSession((elementPlayer as any).session, 'session:changed');
    lastElementSessionRef = session;
    return;
  }
  logConsole('session:changed', detail);
}

/**
 * Handle model-changed event from configure
 */
function handleModelChange(event: CustomEvent) {
  if (debug) console.log(`[pie-element-player] Model changed:`, event.detail);
  model = event.detail;
  logConsole('model:changed', event.detail);
}

function handleModelApply(nextModel: any) {
  logConsole('model:apply:start', {
    nextModelKeys: nextModel ? Object.keys(nextModel) : [],
    hadModel: !!model,
  });
  model = { ...(nextModel ?? {}) };
  modelVersion += 1;
  sessionVersion += 1;
  logConsole('model:apply', nextModel);
  const requestId = ++modelRequestId;
  buildModel(requestId, sessionVersion, modelVersion);
}

function handleSplitPointerDown(event: PointerEvent) {
  const container = (event.currentTarget as HTMLElement)?.parentElement;
  if (!container) return;

  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);

  const startX = event.clientX;
  const startRatio = splitRatio;
  const rect = container.getBoundingClientRect();

  const onMove = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientX - startX;
    const next = ((startRatio / 100) * rect.width + delta) / rect.width;
    splitRatio = Math.min(80, Math.max(20, Math.round(next * 100)));
  };

  const onUp = () => {
    target.releasePointerCapture(event.pointerId);
    document.body.style.cursor = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  document.body.style.cursor = 'col-resize';
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
</script>

<div class="pie-element-player">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading {elementName}...</p>
    </div>
  {:else if error}
    <div class="error">
      <h3>⚠️ Error</h3>
      <p>{error}</p>
    </div>
  {:else}
    {#if hasConfigure}
      <Tabs
        tabs={[
          { id: 'delivery', label: 'Delivery' },
          { id: 'configure', label: 'Configure' }
        ]}
        bind:active={activeTab}
      />
    {/if}
    {#if controllerWarning}
      <div class="warning">{controllerWarning}</div>
    {/if}
    {#if configureWarning}
      <div class="warning">{configureWarning}</div>
    {/if}

    <div class="content" style={`grid-template-columns: ${splitRatio}% 12px ${100 - splitRatio}%`}>
      <main>
        <pie-esm-element-player
          bind:this={elementPlayer}
          class="element-container"
          class:hidden={activeTab !== 'delivery'}
          element-name={elementName}
          onsession-changed={handleSessionChange}
        ></pie-esm-element-player>
        {#if hasConfigure}
          <div
            bind:this={configureContainer}
            class="configure-container"
            class:hidden={activeTab !== 'configure'}
          ></div>
        {/if}
      </main>

      <div class="splitter" onpointerdown={handleSplitPointerDown} role="separator" aria-orientation="vertical"></div>

      <aside class="controls">
        <div class="panel">
          <h3>Mode</h3>
          <ModeSelector bind:mode evaluateDisabled={playerRole !== 'instructor'} />
        </div>

        <div class="panel">
          <h3>Role</h3>
          <div class="role-selector">
            <label class:active={playerRole === 'student'} class:disabled={roleLocked}>
              <input
                type="radio"
                bind:group={playerRole}
                value="student"
                disabled={roleLocked}
              />
              <span>Student</span>
            </label>
            <label class:active={playerRole === 'instructor'}>
              <input type="radio" bind:group={playerRole} value="instructor" />
              <span>Instructor</span>
            </label>
          </div>
        </div>


        <SessionPanel {session} />

        <ScoringPanel {score} />

        {#if modelError}
          <div class="warning">{modelError}</div>
        {/if}
        <ModelPanel model={model} onApply={handleModelApply} />

      </aside>
    </div>
  {/if}
</div>

<style>
  :host {
    display: block;
  }

  .pie-element-player {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }

  .loading {
    padding: 3rem;
    text-align: center;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 1rem;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    padding: 2rem;
    margin: 1rem;
    background: #ffebee;
    border: 2px solid #d32f2f;
    border-radius: 4px;
    color: #c62828;
  }

  .error h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .error p {
    margin: 0;
  }

  .warning {
    margin: 0.75rem 0 1rem;
    padding: 0.75rem 1rem;
    background: #fff8e1;
    border: 1px solid #f1c232;
    border-radius: 4px;
    color: #8a6d3b;
    font-size: 0.9rem;
  }

  .content {
    display: grid;
  }

  main {
    min-width: 0;
    padding-right: 0.75rem;
  }

  aside {
    min-width: 0;
    padding-left: 0.75rem;
  }

  .splitter {
    width: 2px;
    cursor: col-resize;
    border-radius: 4px;
    background-color: #e5e7eb;
    align-self: stretch;
    z-index: 1;
    touch-action: none;
  }

  .splitter:hover {
    background-color: #cbd5f5;
  }

  .hidden {
    display: none;
  }

  .panel {
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .panel h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    color: #666;
    font-weight: 600;
  }

  .role-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .role-selector label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .role-selector label:hover {
    background: #f5f5f5;
  }

  .role-selector label.active {
    background: #e3f2fd;
    border-color: #0066cc;
  }

  .role-selector label.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .role-selector label.disabled:hover {
    background: transparent;
  }



  /* Make responsive for smaller screens */
  @media (max-width: 900px) {
    .content {
      grid-template-columns: 1fr;
    }

    .splitter {
      display: none;
    }

    aside {
      width: 100%;
    }
  }
</style>
