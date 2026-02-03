<script lang="ts">
/**
 * Print View - Shows the print-friendly version of the element
 *
 * Uses the EsmPrintPlayer web component for consistent API with interactive player.
 */
import { onMount } from 'svelte';
import {
  renderMathInContainer,
  createMathRenderingObserver,
} from '../lib/math-rendering-coordinator';
import '@pie-element/element-player/players';

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

// DOM reference for math rendering
let printContainer = $state<HTMLDivElement | null>(null);
let mathObserver: MutationObserver | null = null;

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
</script>

<div class="print-view" bind:this={printContainer}>
  <pie-esm-print-player
    element-name={elementName}
    {role}
    model={model}
  />
</div>

<style>
  .print-view {
    height: 100%;
    overflow: auto;
    padding: 1rem;
  }
</style>
