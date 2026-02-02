<script lang="ts">
/**
 * Print View - Shows the print-friendly version of the element
 */
import { onMount, onDestroy } from 'svelte';
import {
  renderMathInContainer,
  createMathRenderingObserver,
} from '../lib/math-rendering-coordinator';

// Props
let {
  elementName = '',
  model = {},
  role = 'student',
  debug = false,
}: {
  elementName: string;
  model: any;
  role: 'student' | 'instructor';
  debug?: boolean;
} = $props();

// DOM reference
let printContainer = $state<HTMLDivElement | null>(null);
let printInstance: HTMLElement | null = null;

// Math rendering observer
let mathObserver: MutationObserver | null = null;

// Derived values
const printTag = $derived(`${elementName}-print`);

// Update print instance when model or role changes
$effect(() => {
  if (printInstance && model) {
    try {
      (printInstance as any).model = model;
      (printInstance as any).options = { role };
      if (debug) console.log('[print-view] model/role updated', { model, role });
    } catch (err) {
      console.error('[print-view] Error updating print properties:', err);
    }
  }
});

// Setup parent-level math rendering for print view
// Print elements render math internally, but parent catches:
// - Rationales in print view
// - Dynamic content that appears after initial render
// - LaTeX in prompts and feedback
$effect(() => {
  if (printContainer) {
    // Clean up previous observer
    if (mathObserver) {
      mathObserver.disconnect();
    }

    // Initial render
    renderMathInContainer(printContainer);

    // Setup mutation observer to catch dynamic content changes
    mathObserver = createMathRenderingObserver(printContainer, { debounceMs: 150 });

    // Cleanup on unmount
    return () => {
      if (mathObserver) {
        mathObserver.disconnect();
        mathObserver = null;
      }
    };
  }
});

onMount(() => {
  // Create print instance
  if (printContainer) {
    printInstance = document.createElement(printTag);
    printContainer.appendChild(printInstance);

    // Set initial model and options
    if (model) {
      (printInstance as any).model = model;
      (printInstance as any).options = { role };
      if (debug) console.log('[print-view] Initial model set:', model);
    }
  }
});

onDestroy(() => {
  if (printInstance) {
    printInstance.remove();
  }
});
</script>

<div class="print-view">
  <div bind:this={printContainer} class="print-container"></div>
</div>

<style>
  .print-view {
    height: 100%;
    overflow: auto;
  }

  .print-container {
    padding: 1rem;
    height: 100%;
  }
</style>
