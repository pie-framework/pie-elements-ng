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
import Tabs from './components/Tabs.svelte';
import { loadElement, loadController } from './lib/element-loader';
import type { PieController } from './lib/types';
import { createKatexRenderer } from '@pie-elements-ng/math-typesetting';
import type { MathRenderer } from '@pie-elements-ng/math-typesetting';

// Props with Svelte 5 runes
let {
  elementName = '',
  cdnUrl = 'http://localhost:5179',
  model = $bindable({}),
  session = $bindable({}),
  mode = $bindable('gather'),
  showConfigure = false,
  mathRenderer = $bindable<MathRenderer>(createKatexRenderer()),
  debug = false,
}: {
  elementName?: string;
  cdnUrl?: string;
  model?: any;
  session?: any;
  mode?: 'gather' | 'view' | 'evaluate';
  showConfigure?: boolean;
  mathRenderer?: MathRenderer;
  debug?: boolean;
} = $props();

// State
let loading = $state(true);
let error = $state<string | null>(null);
let activeTab = $state('delivery');
let score = $state<any>(null);
let controller = $state<PieController | null>(null);
let hasConfigure = $state(false);

// DOM references
let elementContainer: HTMLDivElement;
let configureContainer: HTMLDivElement;
let elementInstance: HTMLElement | null = null;
let configureInstance: HTMLElement | null = null;

// Derived values
const elementTag = $derived(`${elementName}-element`);
const configureTag = $derived(`${elementName}-configure`);

/**
 * Initialize the element player
 * Loads the element, controller, and optionally configure component
 */
onMount(async () => {
  try {
    if (!elementName) {
      throw new Error('element-name attribute is required');
    }

    const packageName = `@pie-element/${elementName}`;

    if (debug) console.log(`[pie-element-player] Loading element: ${elementName}`);

    // Load and register the element
    await loadElement(packageName, elementTag, cdnUrl, debug);

    // Try to load controller
    try {
      const ctrl = await loadController(packageName, cdnUrl, debug);
      controller = ctrl;
    } catch (e) {
      if (debug) console.warn(`[pie-element-player] Controller not available:`, e);
    }

    // Try to load configure if requested (silently fail if not available)
    if (showConfigure) {
      try {
        await loadElement(`${packageName}/configure`, configureTag, cdnUrl, debug, true);
        hasConfigure = true;
        if (debug) console.log(`[pie-element-player] Configure component loaded`);
      } catch (e) {
        // Configure is optional - silently ignore if not available
        if (debug) console.log(`[pie-element-player] Configure not available (this is normal)`);
      }
    }

    loading = false;

    // Wait for next tick to ensure DOM containers are rendered
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Create element instance
    if (elementContainer) {
      elementInstance = document.createElement(elementTag);
      elementInstance.addEventListener('session-changed', handleSessionChange as EventListener);
      elementContainer.appendChild(elementInstance);

      // Set initial properties immediately after appending to DOM
      // Only set if model has actual content (not just empty object)
      if (model && Object.keys(model).length > 0) {
        (elementInstance as any).session = session;
        (elementInstance as any).model = { ...model, mode };
        if (debug)
          console.log(`[pie-element-player] Set initial element props:`, { mode, model, session });
      }
    }

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
  if (elementInstance) {
    elementInstance.removeEventListener('session-changed', handleSessionChange as EventListener);
    elementInstance.remove();
  }
  if (configureInstance) {
    configureInstance.removeEventListener('model-changed', handleModelChange as EventListener);
    configureInstance.remove();
  }
});

/**
 * Update element properties when they change
 */
$effect(() => {
  if (elementInstance && model) {
    try {
      (elementInstance as any).model = { ...model, mode };
      (elementInstance as any).session = session;

      if (debug) {
        console.log(`[pie-element-player] Updated element props:`, { mode, model, session });
      }
    } catch (err) {
      console.error(`[pie-element-player] Error updating element properties:`, err);
    }
  }
});

/**
 * Render math when element content changes
 */
$effect(() => {
  if (elementContainer && mathRenderer && !loading) {
    try {
      // Call math renderer on the container to process all math elements
      mathRenderer(elementContainer);

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
      scoreMethod(model, session, { mode })
        .then((result: any) => {
          score = result;
          if (debug) console.log(`[pie-element-player] Score result:`, result);
        })
        .catch((err: any) => {
          console.error(`[pie-element-player] Scoring error:`, err);
          if (debug) score = { error: err.message };
        });
    } else {
      console.warn(`[pie-element-player] Controller has no score or outcome method`);
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
  session = event.detail;
}

/**
 * Handle model-changed event from configure
 */
function handleModelChange(event: CustomEvent) {
  if (debug) console.log(`[pie-element-player] Model changed:`, event.detail);
  model = event.detail;
}

/**
 * Reset session and mode
 */
function reset() {
  if (debug) console.log(`[pie-element-player] Resetting`);
  session = {};
  mode = 'gather';
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

    <div class="content">
      <main>
        <div
          bind:this={elementContainer}
          class="element-container"
          class:hidden={activeTab !== 'delivery'}
        ></div>
        {#if hasConfigure}
          <div
            bind:this={configureContainer}
            class="configure-container"
            class:hidden={activeTab !== 'configure'}
          ></div>
        {/if}
      </main>

      <aside class="controls">
        <div class="panel">
          <h3>Mode</h3>
          <ModeSelector bind:mode />
          <button class="reset-button" onclick={reset}>Reset</button>
        </div>

        <SessionPanel {session} />

        <ScoringPanel {score} />
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

  .content {
    display: flex;
    gap: 1rem;
  }

  main {
    flex: 1;
    min-width: 0;
  }

  aside {
    width: 320px;
    flex-shrink: 0;
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

  .reset-button {
    margin-top: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .reset-button:hover {
    background: #0052a3;
  }

  .reset-button:active {
    background: #004080;
  }

  /* Make responsive for smaller screens */
  @media (max-width: 900px) {
    .content {
      flex-direction: column;
    }

    aside {
      width: 100%;
    }
  }
</style>
