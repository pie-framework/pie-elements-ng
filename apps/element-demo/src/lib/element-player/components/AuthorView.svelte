<script lang="ts">
/**
 * Author View - Shows the configure component for authoring questions
 */
import { onMount, onDestroy, createEventDispatcher } from 'svelte';
import {
  renderMathInContainer,
  createMathRenderingObserver,
} from '../lib/math-rendering-coordinator';

const dispatch = createEventDispatcher();

// Props
let {
  elementName = '',
  model = {},
  debug = false,
}: {
  elementName: string;
  model: any;
  debug?: boolean;
} = $props();

// DOM reference
let configureContainer = $state<HTMLDivElement | null>(null);
let configureInstance: HTMLElement | null = null;

// Math rendering observer
let mathObserver: MutationObserver | null = null;

// Derived values
const configureTag = $derived(`${elementName}-configure`);

// Update configure properties when model changes
$effect(() => {
  if (configureInstance && model) {
    try {
      (configureInstance as any).model = model;
      if (debug) console.log('[author-view] model updated', model);
    } catch (err) {
      console.error('[author-view] Error updating configure model:', err);
    }
  }
});

// Setup parent-level math rendering for author view
// Configure components may have math in preview areas
$effect(() => {
  if (configureContainer) {
    // Clean up previous observer
    if (mathObserver) {
      mathObserver.disconnect();
    }

    // Initial render
    renderMathInContainer(configureContainer);

    // Setup mutation observer to catch dynamic content changes
    mathObserver = createMathRenderingObserver(configureContainer, { debounceMs: 150 });

    // Cleanup on unmount
    return () => {
      if (mathObserver) {
        mathObserver.disconnect();
        mathObserver = null;
      }
    };
  }
});

/**
 * Handle model-changed event from configure
 */
function handleModelChange(event: CustomEvent) {
  if (debug) console.log('[author-view] Model changed:', event.detail);
  dispatch('model-changed', event.detail);
}

onMount(() => {
  // Create configure instance
  if (configureContainer) {
    configureInstance = document.createElement(configureTag);
    configureInstance.addEventListener('model-changed', handleModelChange as EventListener);
    configureContainer.appendChild(configureInstance);

    // Set initial model
    if (model) {
      (configureInstance as any).model = model;
      if (debug) console.log('[author-view] Initial model set:', model);
    }
  }
});

onDestroy(() => {
  if (configureInstance) {
    configureInstance.removeEventListener('model-changed', handleModelChange as EventListener);
    configureInstance.remove();
  }
});
</script>

<div class="author-view">
  <div bind:this={configureContainer} class="configure-container"></div>
</div>

<style>
  .author-view {
    height: 100%;
    overflow: auto;
  }

  .configure-container {
    padding: 1rem;
    height: 100%;
  }
</style>
