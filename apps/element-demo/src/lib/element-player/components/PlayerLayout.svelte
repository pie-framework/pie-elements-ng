<script lang="ts">
/**
 * Player Layout Component
 *
 * Simplified layout for views that don't need control panels (author, print, source).
 * Handles element loading and controller initialization.
 */
import { onMount } from 'svelte';
import { loadElement, loadController, loadAuthor, loadPrint } from '../lib/demo-element-loader';
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
  {#if controllerWarning}
    <div class="warning">{controllerWarning}</div>
  {/if}
  {#if configureWarning}
    <div class="warning">{configureWarning}</div>
  {/if}

  <div class="player-content">
    {@render children?.()}
  </div>
{/if}

<style>
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
    margin: 0.75rem 1rem 1rem;
    padding: 0.75rem 1rem;
    background: #fff8e1;
    border: 1px solid #f1c232;
    border-radius: 4px;
    color: #8a6d3b;
    font-size: 0.9rem;
  }

  .player-content {
    height: 100%;
    overflow: auto;
    padding: 1rem;
  }
</style>
