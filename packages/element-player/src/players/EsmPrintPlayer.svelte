<svelte:options
  customElement={{
    tag: "pie-esm-print-player",
    shadow: "none",
    props: {
      elementName: { reflect: true, type: "String", attribute: "element-name" },
      cdnUrl: { reflect: true, type: "String", attribute: "cdn-url" },
      model: { reflect: false, type: "Object" },
      role: { reflect: true, type: "String" }
    }
  }}
/>

<script lang="ts">
/**
 * ESM Print Player
 *
 * A web component that loads and renders PIE elements in print mode using ESM imports.
 * Similar to EsmElementPlayer but loads print exports, uses role instead of session,
 * and handles math rendering internally.
 *
 * Usage:
 *   <pie-esm-print-player element-name="multiple-choice" role="student"></pie-esm-print-player>
 *
 * Properties:
 *   - elementName: Name of the element to load (e.g., "multiple-choice")
 *   - model: PIE model configuration
 *   - role: "student" or "instructor" (determines answer visibility)
 *   - cdnUrl: Optional CDN URL override
 *
 * Events: None (print views are static)
 */

import { onMount } from 'svelte';
import { loadElement as loadElementFromCdn } from '../lib/element-loader';
import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
import type { MathRenderer } from '@pie-element/shared-math-rendering-core';

interface Props {
  elementName?: string;
  cdnUrl?: string;
  model?: any;
  role?: 'student' | 'instructor';
}

let { elementName = '', cdnUrl = '', model = $bindable(), role = 'student' }: Props = $props();

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
    console.error('[esm-print-player] Math rendering error:', err);
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
  console.log('[esm-print-player] Element name changed:', elementName);
  if (elementName) {
    loadElement();
  } else {
    error = 'No element name provided';
    loading = false;
  }
});

// Watch for model changes
$effect(() => {
  if (elementInstance && model !== undefined) {
    try {
      (elementInstance as any).model = model;
    } catch (err) {
      console.error('[esm-print-player] Error setting model:', err);
    }
  }
});

// Watch for role changes
$effect(() => {
  if (elementInstance && role !== undefined) {
    try {
      (elementInstance as any).options = { role };
    } catch (err) {
      console.error('[esm-print-player] Error setting role:', err);
    }
  }
});

// Initialize math rendering on mount
onMount(() => {
  // Create math renderer once (shared across all print elements)
  mathRenderer = createMathjaxRenderer();

  // Register globally for backward compatibility
  if (typeof window !== 'undefined') {
    (window as any)['@pie-lib/math-rendering'] = {
      renderMath: mathRenderer,
    };
  }

  // Start preloading MathJax immediately for print views
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
      }, 150); // Longer debounce for print (less interactive)
    });

    reconnectMathObserver();

    // Initial render
    void renderMathSafely();
  }
});

// Render math when model or role changes
$effect(() => {
  if (container && mathRenderer && (model || role)) {
    // Use requestAnimationFrame to render after element updates DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void renderMathSafely();
      });
    });
  }
});

async function loadElement() {
  if (!elementName) {
    error = 'No element name provided';
    loading = false;
    return;
  }

  try {
    loading = true;
    error = null;

    // Load from /print export
    const packageName = `@pie-element/${elementName}/print`;
    console.log(`[esm-print-player] Loading print element: ${packageName}`);

    // Register custom element if not already registered
    const tagName = `${elementName}-print`;
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
      console.log(`[esm-print-player] Reusing element instance: ${tagName}`);
    } else {
      if (elementInstance) {
        elementInstance.remove();
      }
      console.log(`[esm-print-player] Creating element instance: ${tagName}`);
      elementInstance = document.createElement(tagName);
      currentTagName = tagName;
    }

    // Set initial properties
    if (model !== undefined) {
      (elementInstance as any).model = model;
    }
    if (role !== undefined) {
      (elementInstance as any).options = { role };
    }

    // Clear container and add element if not already attached
    if (container) {
      if (elementInstance.parentElement !== container) {
        container.innerHTML = '';
        container.appendChild(elementInstance);
      }
    }

    console.log(`[esm-print-player] Print element ${elementName} loaded successfully`);
    loading = false;
  } catch (err) {
    console.error(`[esm-print-player] Failed to load print element ${elementName}:`, err);
    error = err instanceof Error ? err.message : String(err);
    loading = false;
  }
}
</script>

<div bind:this={container} class="esm-print-player">
  {#if loading}
    <div class="loading">Loading {elementName} (print)...</div>
  {/if}
  {#if error}
    <div class="error">
      <strong>Error loading print element:</strong>
      <pre>{error}</pre>
    </div>
  {/if}
</div>

<style>
  .esm-print-player {
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
