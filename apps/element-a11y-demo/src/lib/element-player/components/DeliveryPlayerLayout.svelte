<script lang="ts">
/**
 * Delivery Player Layout Component
 *
 * Delivery layout wrapper for the element player.
 */
import { onMount } from 'svelte';
import { loadController } from '../lib/demo-element-loader';
import type { PieController } from '../lib/types';
import type { PlayerType } from '$lib/config/player-runtime';

// Props
let {
  elementName = '',
  model = {},
  session = {},
  mode = $bindable('gather'),
  playerRole = $bindable('student'),
  playerType = 'esm',
  partialScoring = $bindable(true),
  controller = $bindable<PieController | null>(null),
  capabilities = undefined,
  debug = false,
  children,
}: {
  elementName: string;
  model: any;
  session: any;
  mode?: 'gather' | 'view' | 'evaluate';
  playerRole?: 'student' | 'instructor';
  playerType?: PlayerType;
  partialScoring?: boolean;
  controller?: PieController | null;
  capabilities?: string[];
  debug?: boolean;
  children?: any;
} = $props();

// State
let loading = $state(true);
let error = $state<string | null>(null);
let controllerWarning = $state<string | null>(null);

// Effects
$effect(() => {
  if (playerRole !== 'instructor' && mode === 'evaluate') {
    mode = 'view';
  }
});

onMount(async () => {
  try {
    if (!elementName) {
      throw new Error('element-name is required');
    }

    const packageName = `@pie-element/${elementName}`;

    if (debug) console.log(`[delivery-player-layout] Loading element: ${elementName}`);

    // For ESM mode, load controller from local modules if not provided.
    // In IIFE mode, controller is supplied by the IIFE bundle loader.
    if (playerType === 'esm' && !controller) {
      try {
        const ctrl = await loadController(packageName, '', debug);
        controller = ctrl;
      } catch (e) {
        controllerWarning = `Controller not available for "${elementName}".`;
        console.warn(`[delivery-player-layout] Controller not available for ${elementName}`);
      }
    }

    loading = false;
    if (debug) console.log('[delivery-player-layout] ✓ Element player initialized');
  } catch (err: any) {
    error = err.message;
    loading = false;
    console.error('[delivery-player-layout] Error initializing:', err);
  }
});

function handleModelApply(nextModel: any) {
  // Model updates are handled by the store in parent routes
  console.log('[delivery-player-layout] Model apply requested:', nextModel);
}
</script>

<div class="layout-container">
  {#if loading}
    <div class="flex flex-col items-center justify-center p-12 text-base-content/60">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-4">Loading {elementName}...</p>
    </div>
  {:else if error}
    <div class="alert alert-error m-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    </div>
  {:else}
    {#if controllerWarning}
      <div class="alert alert-warning mx-4 mt-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{controllerWarning}</span>
      </div>
    {/if}

    <div class="player-content">
      <main class="flex-1 min-w-0 overflow-auto">
        {@render children?.()}
      </main>
    </div>
  {/if}
</div>

<style>
  .layout-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .player-content {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
