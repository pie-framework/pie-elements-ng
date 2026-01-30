<script lang="ts">
/**
 * Delivery View - Shows the rendered PIE element for student/instructor interaction
 */
import { EsmElementPlayer } from '@pie-element/element-player/players';
import { onMount, createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

// Props
let {
  elementName = '',
  elementModel = {},
  session = $bindable({}),
  mathRenderer = undefined,
  debug = false
}: {
  elementName: string;
  elementModel: any;
  session?: any;
  mathRenderer?: any;
  debug?: boolean;
} = $props();

// DOM reference
let elementPlayer = $state<HTMLElement | null>(null);

// Track last session to avoid infinite loops
let lastElementSessionRef = $state<any>(null);

// Update element session when session prop changes
$effect(() => {
  if (!elementPlayer) return;

  if (session) {
    const sessionChanged = JSON.stringify(session) !== JSON.stringify(lastElementSessionRef);
    if (sessionChanged) {
      lastElementSessionRef = session;
      try {
        (elementPlayer as any).session = session;
        if (debug) console.log('[delivery-view] session updated', { value: session?.value });
      } catch (err) {
        console.error('[delivery-view] Error setting element session:', err);
      }
    }
  }
});

// Update element model when elementModel prop changes
$effect(() => {
  if (!elementPlayer || !elementModel) return;

  try {
    (elementPlayer as any).model = elementModel;
    if (debug) console.log('[delivery-view] model updated', { prompt: elementModel?.prompt });
  } catch (err) {
    console.error('[delivery-view] Error setting element model:', err);
  }
});

// Render math when element content changes
$effect(() => {
  if (elementPlayer && mathRenderer) {
    try {
      mathRenderer(elementPlayer);
      if (debug) console.log('[delivery-view] Math rendering applied');
    } catch (err) {
      console.error('[delivery-view] Math rendering error:', err);
    }
  }
});

/**
 * Handle session-changed event from element
 */
function handleSessionChange(event: CustomEvent) {
  if (debug) console.log('[delivery-view] Session changed:', event.detail);
  const detail = event.detail as any;
  if (detail?.session) {
    session = detail.session;
    lastElementSessionRef = session;
    dispatch('session-changed', session);
    return;
  }
  if (elementPlayer && (elementPlayer as any).session) {
    session = (elementPlayer as any).session;
    lastElementSessionRef = session;
    dispatch('session-changed', session);
    return;
  }
}

onMount(() => {
  // Initialize tracking
  lastElementSessionRef = session;
});
</script>

<div class="delivery-view">
  <div
    bind:this={elementPlayer}
    class="element-container"
  >
    <EsmElementPlayer
      {elementName}
      model={elementModel}
      bind:session={session}
      on:session-changed={handleSessionChange}
    />
  </div>
</div>

<style>
  .delivery-view {
    height: 100%;
    overflow: auto;
  }

  .element-container {
    padding: 1rem;
  }
</style>
