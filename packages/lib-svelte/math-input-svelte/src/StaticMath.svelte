<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import MathQuill from '@pie-element/shared-mathquill';

// Props using Svelte 5 runes syntax
let latex = $state('');

// Expose prop
export { latex };

let container: HTMLElement;
let staticMath: any = null;

onMount(() => {
  const MQ = MathQuill.getInterface(3);
  staticMath = MQ.StaticMath(container);

  if (latex) {
    staticMath.latex(latex);
  }
});

// Sync latex prop to MathQuill using $effect
$effect(() => {
  if (staticMath && latex) {
    staticMath.latex(latex);
  }
});

onDestroy(() => {
  staticMath = null;
});
</script>

<div bind:this={container} class="static-math-container"></div>

<style>
  @import '@pie-element/shared-mathquill/mathquill.css';

  .static-math-container {
    display: inline-block;
    min-width: 20px;
    min-height: 20px;
  }
</style>
