<script lang="ts">
/**
 * Delivery View - Shows the rendered PIE element for student/instructor interaction
 */
import DemoElementPlayer from './DemoElementPlayer.svelte';
import { onMount, createEventDispatcher } from 'svelte';
import { sessionsEqual } from '@pie-element/shared-utils';
import {
  renderMathInContainer,
  createMathRenderingObserver,
} from '../lib/math-rendering-coordinator';

const dispatch = createEventDispatcher();

// Props
let {
  elementName = '',
  elementModel = {},
  session = $bindable({}),
  debug = false,
}: {
  elementName: string;
  elementModel: any;
  session?: any;
  debug?: boolean;
} = $props();

// DOM reference
let elementPlayer = $state<HTMLElement | null>(null);

// Track last session to avoid infinite loops - use plain variables, not $state
let lastElementSessionRef: any = null;
let updatingFromElement = false;
let updateTimer: ReturnType<typeof setTimeout> | null = null;

// Math rendering observer
let mathObserver: MutationObserver | null = null;

// Update element session when session prop changes
$effect(() => {
  // Guard against re-entry when element fires session-changed
  if (!elementPlayer || updatingFromElement) {
    return;
  }

  if (session && !sessionsEqual(session, lastElementSessionRef)) {
    lastElementSessionRef = session;
    // Don't modify reactive state inside effect - causes infinite loop
    try {
      (elementPlayer as any).session = session;
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

// Setup parent-level math rendering to catch rationales, feedback, and dynamic content
// Elements handle their own internal math rendering, but parent catches:
// - Rationales that appear after element render
// - Feedback overlays
// - Dynamic content changes (show correct answer, etc.)
//
// Strategy: Use MutationObserver to detect when content actually changes in the DOM
// This is more reliable than timers since it responds to actual render events
$effect(() => {
  if (elementPlayer) {
    // Clean up previous observer
    if (mathObserver) {
      mathObserver.disconnect();
    }

    // Setup mutation observer FIRST - this catches the element's initial render
    // Use a very short debounce (10ms) to batch rapid mutations but respond quickly
    mathObserver = createMathRenderingObserver(elementPlayer, { debounceMs: 10 });

    // Also render immediately in case content is already present
    // Use requestAnimationFrame to ensure we render after the current frame
    requestAnimationFrame(() => {
      if (elementPlayer) {
        renderMathInContainer(elementPlayer);
      }
    });

    // Cleanup on unmount
    return () => {
      if (mathObserver) {
        mathObserver.disconnect();
        mathObserver = null;
      }
    };
  }
});

// Re-render math when model changes (mode/role switches)
// The MutationObserver will catch the DOM changes, but we also do an explicit render
// to ensure math is processed even if the mutation observer's timing is off
$effect(() => {
  if (elementPlayer && elementModel) {
    // Use requestAnimationFrame to render after React updates the DOM
    requestAnimationFrame(() => {
      // Double-rAF to ensure we're after React's commit phase
      requestAnimationFrame(() => {
        if (elementPlayer) {
          renderMathInContainer(elementPlayer);
        }
      });
    });
  }
});

/**
 * Handle session-changed event from element
 */
function handleSessionChange(event: CustomEvent) {
  // Guard against re-entry when we're updating the element from our effect
  if (updatingFromElement) {
    return;
  }

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

  // Always update when element fires session-changed event
  // The element knows best when session has changed
  if (newSession) {
    // Update session directly - this will be reactive and flow up to parent
    session = newSession;
    lastElementSessionRef = newSession;
    dispatch('session-changed', session);
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
      {session}
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
