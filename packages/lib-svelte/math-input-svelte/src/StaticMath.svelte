<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { createStatic } from '@pie-element/shared-math-engine';

// Props using Svelte 5 runes syntax
let latex = $state('');

// Expose prop
export { latex };

let container: HTMLElement;
let staticMath: any = null;

onMount(() => {
  staticMath = createStatic(latex);
  staticMath.mount(container);

  if (latex && latex !== staticMath.getLatex()) {
    staticMath.setLatex(latex);
  }
});

// Sync latex prop to MathQuill using $effect
$effect(() => {
  if (!staticMath) {
    return;
  }

  const nextLatex = latex ?? '';
  if (nextLatex !== staticMath.getLatex()) {
    staticMath.setLatex(nextLatex);
  }
});

onDestroy(() => {
  staticMath?.destroy?.();
  staticMath = null;
});
</script>

<div bind:this={container} class="static-math-container"></div>

<style>
  .static-math-container {
    display: inline-block;
    min-width: 20px;
    min-height: 20px;
  }
</style>
