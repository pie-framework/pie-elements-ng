<script lang="ts">
import { onMount } from 'svelte';
import { renderMath } from './index';

/**
 * Math rendering component
 * Renders LaTeX/MathML expressions in HTML content using MathJax
 */
interface Props {
  html: string;
  useSingleDollar?: boolean;
}

const { html, useSingleDollar = false }: Props = $props();

let containerRef: HTMLDivElement;

onMount(async () => {
  if (containerRef) {
    await renderMath(containerRef, { useSingleDollar });
  }
});

$effect(() => {
  if (containerRef && html) {
    // Render math when html changes
    renderMath(containerRef, { useSingleDollar });
  }
});
</script>

<div class="pie-math" bind:this={containerRef}>
  {@html html}
</div>

<style>
  .pie-math {
    /* Math-specific styling will be added when renderer is implemented */
  }

  /* Placeholder styles for math elements */
  .pie-math :global(math),
  .pie-math :global(.math) {
    display: inline-block;
    font-style: italic;
  }
</style>
