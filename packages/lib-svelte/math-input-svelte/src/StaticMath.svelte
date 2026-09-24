<script lang="ts">
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import type { StaticMathProps } from './types.js';

let { latex = '' }: StaticMathProps = $props();

let container: HTMLSpanElement;

// MathJax replaces the span's content, so the LaTeX is written here instead of through a
// template expression Svelte would try to update in place.
$effect(() => {
  container.textContent = `\\(${latex}\\)`;
  // `renderMath` is async: a MathJax load failure arrives as a rejection.
  Promise.resolve(renderMath(container)).catch((err: unknown) =>
    console.warn('[math-input-svelte] MathJax render failed', err)
  );
});
</script>

<span bind:this={container}></span>
