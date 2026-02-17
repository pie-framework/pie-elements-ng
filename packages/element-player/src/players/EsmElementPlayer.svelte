<svelte:options
  customElement={{
    tag: "pie-esm-element-player",
    shadow: "none",
    props: {
      elementName: { reflect: true, type: "String", attribute: "element-name" },
      cdnUrl: { reflect: true, type: "String", attribute: "cdn-url" },
      model: { reflect: false, type: "Object" },
      session: { reflect: false, type: "Object" }
    }
  }}
/>

<script lang="ts">
/**
 * ESM Element Player
 *
 * A web component that loads and renders PIE elements using ESM imports.
 * Handles element registration, property management, session updates, and math rendering.
 *
 * Usage:
 *   <pie-esm-element-player element-name="hotspot"></pie-esm-element-player>
 *
 * Properties:
 *   - elementName: Name of the element to load (e.g., "hotspot")
 *   - model: PIE model configuration
 *   - session: PIE session data
 *
 * Events:
 *   - session-changed: Dispatched when session updates
 */

import { createEventDispatcher, onMount } from 'svelte';
import { loadElement as loadElementFromCdn } from '../lib/element-loader';
import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
import type { MathRenderer } from '@pie-element/shared-math-rendering-core';

interface Props {
  elementName?: string;
  cdnUrl?: string;
  model?: any;
  session?: any;
}

let { elementName = '', cdnUrl = '', model = $bindable(), session = $bindable() }: Props = $props();
const dispatch = createEventDispatcher();

let container: HTMLElement;
let elementInstance = $state<HTMLElement | null>(null);
let currentTagName = $state<string | null>(null);
let error = $state<string | null>(null);
let loading = $state(true);
let mathRenderer: MathRenderer | null = null;
let mathObserver: MutationObserver | null = null;
let renderTimeout: number | null = null;
let renderInFlight = false;
let renderQueued = false;
let sessionChangedHandler: ((e: Event) => void) | null = null;

const observerOptions: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
};

const reconnectMathObserver = () => {
  if (mathObserver && container) {
    mathObserver.observe(container, observerOptions);
  }
};

const renderMathSafely = async () => {
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
    console.error('[esm-player] Math rendering error:', err);
  } finally {
    renderInFlight = false;
    reconnectMathObserver();

    if (renderQueued) {
      renderQueued = false;
      queueMicrotask(() => {
        void renderMathSafely();
      });
    }
  }
};

// Watch for elementName changes and load element
$effect(() => {
  console.log('[esm-player] Element name changed:', elementName);
  if (elementName) {
    loadElement();
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
      console.error('[esm-player] Error setting model:', err);
    }
  }
});

// Initialize math rendering on mount
onMount(() => {
  // Create math renderer once
  mathRenderer = createMathjaxRenderer();

  // Register globally for backward compatibility with elements that expect it
  if (typeof window !== 'undefined') {
    (window as any)['@pie-lib/math-rendering'] = {
      renderMath: mathRenderer,
    };
  }

  // Start preloading MathJax immediately
  if (mathRenderer && typeof window !== 'undefined') {
    const tempDiv = document.createElement('div');
    mathRenderer(tempDiv).catch(() => {
      // Ignore errors - just preloading
    });
  }

  return () => {
    if (renderTimeout) {
      clearTimeout(renderTimeout);
      renderTimeout = null;
    }
    if (mathObserver) {
      mathObserver.disconnect();
    }
    if (sessionChangedHandler && elementInstance) {
      elementInstance.removeEventListener('session-changed', sessionChangedHandler);
    }
  };
});

// Set up math rendering observer when container is available
$effect(() => {
  if (container && mathRenderer) {
    // Clean up previous observer
    if (mathObserver) {
      mathObserver.disconnect();
    }
    if (renderTimeout) {
      clearTimeout(renderTimeout);
      renderTimeout = null;
    }

    mathObserver = new MutationObserver(() => {
      if (renderTimeout) {
        clearTimeout(renderTimeout);
      }

      renderTimeout = window.setTimeout(() => {
        void renderMathSafely();
      }, 100);
    });

    reconnectMathObserver();

    // Initial render
    void renderMathSafely();
  }
});

// Render math when model changes
$effect(() => {
  if (container && mathRenderer && model) {
    // Use requestAnimationFrame to render after React/element updates DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void renderMathSafely();
      });
    });
  }
});

// No effect needed - session is set once during loadElement

async function loadElement() {
  if (!elementName) {
    error = 'No element name provided';
    loading = false;
    return;
  }

  try {
    loading = true;
    error = null;

    const packageName = `@pie-element/${elementName}`;
    console.log(`[esm-player] Loading element: ${packageName}`);

    // Register custom element if not already registered
    const tagName = `${elementName}-element`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timeout loading ${packageName} (>10s). Check /@pie- routes, Vite server, and network.`
            )
          ),
        10000
      )
    );
    await Promise.race([loadElementFromCdn(packageName, tagName, cdnUrl), timeoutPromise]);

    // Wait for custom element to be defined
    await customElements.whenDefined(tagName);

    // Reuse existing element instance when possible
    if (elementInstance && currentTagName === tagName) {
      console.log(`[esm-player] Reusing element instance: ${tagName}`);
    } else {
      if (elementInstance) {
        elementInstance.remove();
      }
      console.log(`[esm-player] Creating element instance: ${tagName}`);
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
    if (sessionChangedHandler && elementInstance) {
      elementInstance.removeEventListener('session-changed', sessionChangedHandler);
    }
    sessionChangedHandler = (e: Event) => {
      e.stopPropagation();
      const customEvent = e as CustomEvent;
      const nextSession = (elementInstance as any).session;
      console.log('[esm-player] Session changed:', customEvent.detail);

      dispatch('session-changed', {
        session: nextSession,
        complete: (customEvent.detail as any)?.complete,
        component: (customEvent.detail as any)?.component,
      });
    };
    elementInstance.addEventListener('session-changed', sessionChangedHandler);

    // Clear container and add element if not already attached
    if (container) {
      if (elementInstance.parentElement !== container) {
        container.innerHTML = '';
        container.appendChild(elementInstance);
      }
    }

    console.log(`[esm-player] Element ${elementName} loaded successfully`);
    loading = false;
  } catch (err) {
    console.error(`[esm-player] Failed to load element ${elementName}:`, err);
    error = err instanceof Error ? err.message : String(err);
    loading = false;
  }
}
</script>

<div bind:this={container} class="esm-element-player">
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
  .esm-element-player {
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
