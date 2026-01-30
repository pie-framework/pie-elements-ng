<script lang="ts">
/**
 * Print View - Shows the print-friendly version of the element
 */
import { onMount, onDestroy } from 'svelte';

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
