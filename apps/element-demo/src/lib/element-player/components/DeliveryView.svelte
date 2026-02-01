<script lang="ts">
/**
 * Delivery View - Shows the rendered PIE element for student/instructor interaction
 */
import DemoElementPlayer from './DemoElementPlayer.svelte';
import { onMount, createEventDispatcher } from 'svelte';
import { sessionsEqual } from '@pie-element/shared-utils';

const dispatch = createEventDispatcher();

// Props
let {
  elementName = '',
  elementModel = {},
  session = $bindable({}),
  mathRenderer = undefined,
  debug = false,
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
let updatingFromElement = $state(false);
let elementSessionVersion = $state(0);
let updateTimer: ReturnType<typeof setTimeout> | null = null;

// Update element session when session prop changes
$effect(() => {
  // Guard against re-entry when element fires session-changed
  if (!elementPlayer || updatingFromElement) return;

  if (session && !sessionsEqual(session, lastElementSessionRef)) {
    lastElementSessionRef = session;
    elementSessionVersion += 1;
    try {
      (elementPlayer as any).session = session;
      if (debug)
        console.log('[delivery-view] session updated', {
          value: session?.value,
          version: elementSessionVersion,
        });
    } catch (err) {
      console.error('[delivery-view] Error setting element session:', err);
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
  // Guard against re-entry when we're updating the element from our effect
  if (updatingFromElement) {
    if (debug) console.log('[delivery-view] Ignoring session-changed (updating from element)');
    return;
  }

  if (debug) console.log('[delivery-view] Session changed:', event.detail);

  // Set guard flag to prevent infinite loop
  updatingFromElement = true;

  // Clear any existing timer
  if (updateTimer) {
    clearTimeout(updateTimer);
  }

  const detail = event.detail as any;
  let newSession: any = null;

  if (detail?.session) {
    newSession = detail.session;
  } else if (elementPlayer && (elementPlayer as any).session) {
    newSession = (elementPlayer as any).session;
  }

  // Only update if session actually changed
  if (newSession && !sessionsEqual(newSession, session)) {
    session = newSession;
    lastElementSessionRef = newSession;
    elementSessionVersion += 1;
    if (debug) console.log('[delivery-view] Session version:', elementSessionVersion);
    dispatch('session-changed', session);
  } else {
    // Even if session didn't change, update the ref to prevent effect from running
    lastElementSessionRef = session;
  }

  // Clear guard flag after a longer delay to ensure effect has completed
  updateTimer = setTimeout(() => {
    updatingFromElement = false;
    updateTimer = null;
  }, 100);
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
    <DemoElementPlayer
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
