<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { createField } from '@pie-element/shared-math-engine';

// Props using Svelte 5 runes syntax
let latex = $state('');
let onEdit: (newLatex: string) => void = $state(() => {});

// Expose props
export { latex, onEdit };

let container: HTMLElement;
let mathField: any = null;
let isInternalEdit = false;

onMount(() => {
  mathField = createField(latex, {
    onChange: (newLatex: string) => {
      if (newLatex === latex) {
        return;
      }
      isInternalEdit = true;
      try {
        latex = newLatex;
        onEdit(newLatex);
      } finally {
        isInternalEdit = false;
      }
    },
  });
  mathField.mount(container);

  if (latex && latex !== mathField.getLatex()) {
    mathField.setLatex(latex);
  }
});

// Sync latex prop to MathQuill using $effect
$effect(() => {
  if (!mathField || isInternalEdit) {
    return;
  }

  const nextLatex = latex ?? '';
  if (nextLatex !== mathField.getLatex()) {
    mathField.setLatex(nextLatex);
  }
});

onDestroy(() => {
  mathField?.destroy?.();
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
  mathField?.clear();
}
</script>

<div bind:this={container} class="math-field-container"></div>

<style>
  .math-field-container {
    min-width: 100px;
    min-height: 40px;
  }
</style>
