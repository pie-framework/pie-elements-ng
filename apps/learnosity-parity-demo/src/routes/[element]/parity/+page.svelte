<script lang="ts">
import { onMount } from 'svelte';
import { get } from 'svelte/store';
import type { PageData } from './$types';
import '$lib/element-player/configure-loader';
import '@pie-element/element-player';
import { model, session, mode, role, controller, initializeDemo } from '$lib/stores/demo-state';
import { loadController } from '$lib/element-player/lib/demo-element-loader';
import type { LayoutData } from '../$types';

let { data }: { data: PageData & Partial<LayoutData> } = $props();

// --- Learnosity readiness ---
// Sentinel: look for any Learnosity-rendered content (assess player or inline items).
// lrn-assess is the assess player root; .lrn-widget is used by inline items.
const LEARNOSITY_SENTINEL =
  'lrn-assess, [class*="lrn_widget"], .lrn-widget, [data-lrn-widget-container], button[data-lrn-action="start"]';

let learnosityReady = $state(false);
let learnosityError = $state<string | null>(null);

onMount(() => {
  // Load controller and initialize stores if the layout hasn't done it yet
  const elementName = (data as any).elementName as string | undefined;
  if (elementName && !get(controller)) {
    const initModel = (data as any).initialModel ?? {};
    const initSession = (data as any).initialSession ?? {};
    initializeDemo({
      elementName,
      elementTitle: (data as any).elementTitle ?? elementName,
      model: initModel,
      session: initSession,
      controller: null,
      capabilities: (data as any).capabilities ?? [],
      demos: (data as any).demos,
      activeDemoId: (data as any).activeDemoId,
    });
    loadController(`@pie-element/${elementName}`)
      .then((ctrl) => controller.set(ctrl))
      .catch((e) => console.error('[parity] Failed to load controller:', e));
  }

  if (!data.initPayload) return;

  const script = document.createElement('script');
  script.src = 'https://items.learnosity.com/?v2023.3.LTS';
  script.async = true;
  script.onload = () => initLearnosity();
  script.onerror = () => {
    learnosityError = 'Failed to load Learnosity CDN script.';
  };
  document.head.appendChild(script);

  return () => script.remove();
});

function initLearnosity() {
  const win = window as any;
  if (typeof win.LearnosityItems === 'undefined') {
    learnosityError = 'LearnosityItems not available after CDN script load.';
    return;
  }

  try {
    win.LearnosityItems.init(data.initPayload, '#learnosity-container', {});
  } catch (e) {
    learnosityError = String(e);
    return;
  }

  const interval = setInterval(() => {
    const container = document.getElementById('learnosity-container');
    if (container?.querySelector(LEARNOSITY_SENTINEL)) {
      clearInterval(interval);
      learnosityReady = true;
      container.dataset.learnosityReady = 'true';
    }
  }, 200);

  setTimeout(() => {
    clearInterval(interval);
    if (!learnosityReady) {
      learnosityError = 'Learnosity rendering timed out (30s).';
    }
  }, 30_000);
}

// PIE view model — rebuilt when model/mode/role/controller change
let elementModel = $state<any>(null);

$effect(() => {
  const currentModel = $model;
  const currentMode = $mode;
  const currentRole = $role;
  const currentController = $controller;
  if (!currentModel || !currentController) return;

  (async () => {
    try {
      elementModel = await currentController.model(currentModel, get(session) || {}, {
        mode: currentMode,
        role: currentRole,
      });
    } catch (e) {
      console.error('[parity] model error', e);
    }
  })();
});
</script>

<div class="parity-root">
  <header class="parity-header">
    <h2>Parity — {data.demoId}</h2>
    <p class="parity-item-ref">Learnosity item: <code>{data.itemReference}</code></p>
  </header>

  <div class="parity-columns">
    <section class="parity-column" aria-label="PIE element">
      <h3 class="parity-column-label">PIE</h3>
      <div id="pie-container">
        {#if elementModel}
          <pie-element-player
            strategy="esm"
            view="delivery"
            element-name="mc-populated-blank"
            package-name="@pie-element/mc-populated-blank"
            model={elementModel}
            session={$session ?? {}}
            mode={$mode}
            role={$role}
          ></pie-element-player>
        {/if}
      </div>
    </section>

    <section class="parity-column" aria-label="Learnosity reference">
      <h3 class="parity-column-label">Learnosity (reference)</h3>
      {#if learnosityError}
        <p class="parity-error">{learnosityError}</p>
      {:else if !learnosityReady}
        <p class="parity-loading">Loading Learnosity…</p>
      {/if}
      <div
        id="learnosity-container"
        data-learnosity-ready={learnosityReady ? 'true' : undefined}
      >
        {#if data.itemReference}
          <span class="learnosity-item" data-reference={data.itemReference}></span>
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .parity-root {
    padding: 1rem;
    font-family: sans-serif;
  }
  .parity-header {
    margin-bottom: 1rem;
  }
  .parity-item-ref {
    font-size: 0.85rem;
    color: #555;
  }
  .parity-columns {
    display: grid;
    grid-template-columns: 900px 900px;
    gap: 2rem;
    align-items: start;
    overflow-x: auto;
  }

  #pie-container,
  #learnosity-container {
    width: 900px;
    box-sizing: border-box;
  }
  .parity-column-label {
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    margin-bottom: 0.5rem;
  }
  .parity-loading {
    color: #888;
    font-style: italic;
  }
  .parity-error {
    color: #c00;
    font-size: 0.85rem;
  }
</style>
