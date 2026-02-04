<script lang="ts">
/**
 * Player Layout Component
 *
 * Simplified layout for views that don't need control panels (author, print, source).
 * Handles element loading and controller initialization.
 */
import { onMount } from 'svelte';
import { loadController, loadAuthor, loadPrint } from '../lib/demo-element-loader';
import type { PieController } from '../lib/types';

// Props
let {
  elementName = '',
  controller = $bindable<PieController | null>(null),
  capabilities = undefined,
  debug = false,
  children,
}: {
  elementName: string;
  controller?: PieController | null;
  capabilities?: string[];
  debug?: boolean;
  children?: any;
} = $props();

// State
let loading = $state(true);
let error = $state<string | null>(null);
let hasConfigure = $state(false);
let hasPrint = $state(false);
let configureWarning = $state<string | null>(null);
let controllerWarning = $state<string | null>(null);

// Simple onMount - no complex reactivity
onMount(async () => {
  try {
    if (!elementName) {
      throw new Error('element-name is required');
    }

    const packageName = `@pie-element/${elementName}`;

    if (debug) console.log(`[player-layout] Loading element: ${elementName}`);

    // Load controller if not provided
    if (!controller) {
      try {
        const ctrl = await loadController(packageName, '', debug);
        controller = ctrl;
      } catch (e) {
        controllerWarning = `Controller not available for "${elementName}".`;
        console.warn(`[player-layout] Controller not available for ${elementName}`);
      }
    }

    // Load author/configure component if capabilities indicate it exists
    const configureTag = `${elementName}-configure`;
    if (capabilities?.includes('author')) {
      try {
        console.log(`[player-layout] Loading author component for ${packageName}`);
        const AuthorComponent = await loadAuthor(packageName, '', debug);

        // Register as custom element if not already registered
        if (!customElements.get(configureTag)) {
          customElements.define(configureTag, AuthorComponent);
          console.log(`[player-layout] Author component registered as ${configureTag}`);
        }

        hasConfigure = true;
      } catch (e) {
        console.error('[player-layout] Failed to load author component:', e);
        configureWarning = `Configure component not available for "${elementName}".`;
      }
    }

    // Load print component if capabilities indicate it exists
    const printTag = `${elementName}-print`;
    if (capabilities?.includes('print')) {
      try {
        console.log(`[player-layout] Loading print component for ${packageName}`);
        const PrintComponent = await loadPrint(packageName, '', debug);

        // Register as custom element if not already registered
        if (!customElements.get(printTag)) {
          customElements.define(printTag, PrintComponent);
          console.log(`[player-layout] Print component registered as ${printTag}`);
        }

        hasPrint = true;
      } catch (e) {
        console.error('[player-layout] Failed to load print component:', e);
        // Print is optional, don't show warning
      }
    }

    loading = false;
    if (debug) console.log('[player-layout] ✓ Element player initialized');
  } catch (err: any) {
    error = err.message;
    loading = false;
    console.error('[player-layout] Error initializing:', err);
  }
});
</script>

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
  {#if configureWarning}
    <div class="alert alert-warning mx-4 mt-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{configureWarning}</span>
    </div>
  {/if}

  <div class="h-full overflow-auto p-4">
    {@render children?.()}
  </div>
{/if}
