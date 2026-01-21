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
 * Handles element registration, property management, and session updates.
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

import { createEventDispatcher } from 'svelte';
import { loadElement as loadElementFromCdn } from '../lib/element-loader';

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
let lastSessionRef = $state<any>(undefined);
let error = $state<string | null>(null);
let loading = $state(true);

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
    console.log('[esm-player] model:update', {
      tag: currentTagName,
      id: (model as any)?.id,
      prompt: model?.prompt,
    });
    console.log('[esm-player] elementInstance type:', elementInstance.tagName, elementInstance);
    console.log('[esm-player] Element has model setter?', Object.getOwnPropertyDescriptor(Object.getPrototypeOf(elementInstance), 'model'));
    console.log('[esm-player] Element has session setter?', Object.getOwnPropertyDescriptor(Object.getPrototypeOf(elementInstance), 'session'));
    console.log('[esm-player] Setting model on element...');
    try {
      (elementInstance as any).model = model;
      console.log('[esm-player] Model set successfully');
    } catch (err) {
      console.error('[esm-player] Error setting model:', err);
    }

    // Also ensure session is set when model changes
    // This is important for mode changes where the session object doesn't change
    // but the element needs to have the correct session to calculate responseCorrect
    if (session !== undefined) {
      console.log('[esm-player] About to update session. Session object:', session);
      console.log('[esm-player] Session.value:', (session as any)?.value);
      console.log('[esm-player] Session stringified:', JSON.stringify(session));
      const elementSessionBefore = (elementInstance as any).session;
      console.log('[esm-player] Element session before:', elementSessionBefore);
      console.log('[esm-player] Element session.value before:', elementSessionBefore?.value);

      (elementInstance as any).session = session;

      const elementSessionAfter = (elementInstance as any).session;
      console.log('[esm-player] Element session after:', elementSessionAfter);
      console.log('[esm-player] Element session.value after:', elementSessionAfter?.value);
      console.log('[esm-player] Element session stringified after:', JSON.stringify(elementSessionAfter));
    }
  }
});

$effect(() => {
  if (elementInstance && session !== undefined) {
    const currentElementSession = (elementInstance as any).session;
    // Check if session content is different (not just reference)
    const sessionChanged = JSON.stringify(session) !== JSON.stringify(currentElementSession);

    if (sessionChanged) {
      console.log('[esm-player] Updating element session');
      (elementInstance as any).session = session;
    }
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

    // Listen for session changes
    elementInstance.addEventListener('session-changed', (e: Event) => {
      e.stopPropagation();
      const customEvent = e as CustomEvent;
      const nextSession = (elementInstance as any).session;
      console.log('[esm-player] Session changed:', customEvent.detail);
      if (nextSession !== session) {
        // Update session state but don't set lastSessionRef here
        // Let the effect handle setting the session on the element
        session = nextSession;
      }
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
