<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import MathQuill from '@pie-element/shared-mathquill';

// Props using Svelte 5 runes syntax
let latex = $state('');
let onEdit: (newLatex: string) => void = $state(() => {});

// Expose props
export { latex, onEdit };

let container: HTMLElement;
let mathField: any = null;

onMount(() => {
  const MQ = MathQuill.getInterface(3);
  mathField = MQ.MathField(container, {
    handlers: {
      edit: () => {
        const newLatex = mathField.latex();
        latex = newLatex;
        onEdit(newLatex);
      },
    },
  });

  if (latex) {
    mathField.latex(latex);
  }
});

// Sync latex prop to MathQuill using $effect
$effect(() => {
  if (mathField && latex !== mathField.latex()) {
    mathField.latex(latex);
  }
});

onDestroy(() => {
  mathField = null;
});

// Expose methods via component instance
export function focus() {
  mathField?.focus();
}

export function blur() {
  mathField?.blur();
}

export function clear() {
  mathField?.latex('');
}
</script>

<div bind:this={container} class="math-field-container"></div>

<style>
  @import '@pie-element/shared-mathquill/mathquill.css';

  .math-field-container {
    min-width: 100px;
    min-height: 40px;
  }
</style>
