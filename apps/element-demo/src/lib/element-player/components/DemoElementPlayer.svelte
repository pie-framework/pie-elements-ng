<script lang="ts">
/**
 * Demo Element Player
 *
 * Wrapper around EsmElementPlayer that uses static imports for local development.
 * This component loads PIE elements using the demo-element-loader which supports
 * static imports to work around Vite's dynamic import limitations.
 */

import { createEventDispatcher } from 'svelte';
import { loadElement } from '../lib/demo-element-loader';

interface Props {
  elementName?: string;
  model?: any;
  session?: any;
}

let { elementName = '', model = $bindable(), session = {} }: Props = $props(); // Remove session $bindable
const dispatch = createEventDispatcher();

let container: HTMLElement;
let elementInstance = $state<HTMLElement | null>(null);
let currentTagName = $state<string | null>(null);
let error = $state<string | null>(null);
let loading = $state(true);

// Watch for elementName changes and load element
$effect(() => {
  console.log('[demo-player] Element name changed:', elementName);
  if (elementName) {
    loadElementInstance();
  } else {
    error = 'No element name provided';
    loading = false;
  }
});

$effect(() => {
  if (elementInstance && model !== undefined) {
    try {
      (elementInstance as any).model = model;
    } catch (err) {
      console.error('[demo-player] Error setting model:', err);
    }
  }
});

// No effect needed - session is set once during loadElementInstance

async function loadElementInstance() {
  if (!elementName) {
    error = 'No element name provided';
    loading = false;
    return;
  }

  try {
    loading = true;
    error = null;

    const packageName = `@pie-element/${elementName}`;
    console.log(`[demo-player] Loading element: ${packageName}`);

    // Register custom element if not already registered
    const tagName = `${elementName}-element`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timeout loading ${packageName} (>10s). Check element imports and Vite server.`
            )
          ),
        10000
      )
    );

    // Use demo loader with empty cdnUrl for local development
    await Promise.race([loadElement(packageName, tagName, '', false, false), timeoutPromise]);

    // Wait for custom element to be defined
    await customElements.whenDefined(tagName);

    // Reuse existing element instance when possible
    if (elementInstance && currentTagName === tagName) {
      console.log(`[demo-player] Reusing element instance: ${tagName}`);
    } else {
      if (elementInstance) {
        elementInstance.remove();
      }
      console.log(`[demo-player] Creating element instance: ${tagName}`);
      elementInstance = document.createElement(tagName);
      currentTagName = tagName;
    }

    // Set initial properties
    if (model !== undefined) {
      (elementInstance as any).model = model;
    }
    const nextSession = session ?? (elementInstance as any).session;
    if (nextSession !== undefined) {
      (elementInstance as any).session = nextSession;
    }

    // Listen for session changes - simple dispatch up (no loop risk)
    elementInstance.addEventListener('session-changed', (e: Event) => {
      e.stopPropagation();
      const customEvent = e as CustomEvent;
      const nextSession = (elementInstance as any).session;
      console.log('[demo-player] Session changed:', customEvent.detail);

      dispatch('session-changed', {
        session: nextSession,
        complete: (customEvent.detail as any)?.complete,
        component: (customEvent.detail as any)?.component,
      });
    });

    // Clear container and add element if not already attached
    if (container) {
      if (elementInstance.parentElement !== container) {
        container.innerHTML = '';
        container.appendChild(elementInstance);
      }
    }

    console.log(`[demo-player] Element ${elementName} loaded successfully`);
    loading = false;
  } catch (err) {
    console.error(`[demo-player] Failed to load element ${elementName}:`, err);
    error = err instanceof Error ? err.message : String(err);
    loading = false;
  }
}
</script>

<div bind:this={container} class="demo-element-player">
  {#if loading}
    <div class="loading">Loading {elementName}...</div>
  {/if}
  {#if error}
    <div class="error">
      <strong>Error loading element:</strong>
      <pre>{error}</pre>
    </div>
  {/if}
</div>

<style>
  .demo-element-player {
    width: 100%;
    min-height: 100px;
  }

  .loading {
    padding: 2rem;
    text-align: center;
    color: #666;
    font-style: italic;
  }

  .error {
    padding: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c00;
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
