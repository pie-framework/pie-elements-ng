<svelte:options
  customElement={{
    tag: "pie-esm-element-player",
    shadow: "none",
    props: {
      elementName: { reflect: true, type: "String", attribute: "element-name" },
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

interface Props {
  elementName?: string;
  model?: any;
  session?: any;
}

let { elementName = '', model = $bindable(), session = $bindable() }: Props = $props();

let container: HTMLElement;
let elementInstance: HTMLElement | null = null;
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
    (elementInstance as any).model = model;
  }
});

$effect(() => {
  if (elementInstance && session !== undefined) {
    (elementInstance as any).session = session;
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

    console.log(`[esm-player] Loading element: @pie-element/${elementName}`);

    // Import the element class dynamically with timeout
    const importPromise = import(/* @vite-ignore */ `@pie-element/${elementName}`);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timeout loading @pie-element/${elementName} (>10s). Check import maps and network.`
            )
          ),
        10000
      )
    );

    const module = await Promise.race([importPromise, timeoutPromise]);
    const ElementClass = (module as any).default;

    if (!ElementClass) {
      throw new Error(
        `Element @pie-element/${elementName} does not have a default export. ` +
          `Verify the element exports a custom element class.`
      );
    }

    // Register custom element if not already registered
    const tagName = `${elementName}-element`;
    if (!customElements.get(tagName)) {
      console.log(`[esm-player] Registering custom element: ${tagName}`);
      customElements.define(tagName, ElementClass);
    }

    // Wait for custom element to be defined
    await customElements.whenDefined(tagName);

    // Create element instance
    console.log(`[esm-player] Creating element instance: ${tagName}`);
    elementInstance = document.createElement(tagName);

    // Set initial properties
    if (model !== undefined) {
      (elementInstance as any).model = model;
    }
    if (session !== undefined) {
      (elementInstance as any).session = session;
    }

    // Listen for session changes
    elementInstance.addEventListener('session-changed', (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[esm-player] Session changed:', customEvent.detail);
      session = customEvent.detail;
    });

    // Clear container and add element
    if (container) {
      container.innerHTML = '';
      container.appendChild(elementInstance);
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
