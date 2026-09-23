<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      options: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
// Print players set `options` ({ role }) and the authored model, not a
// controller view model, so answer visibility is decided here.
let { model = null, options = null }: { model?: any; options?: any } = $props();

const isInstructor = $derived(options?.role === 'instructor');
const prompt = $derived(
  model?.promptEnabled !== false && typeof model?.prompt === 'string' ? model.prompt : ''
);
const correctAnswer = $derived(
  typeof model?.correctAnswer === 'string' ? model.correctAnswer.trim() : ''
);
const showAnswerKey = $derived(isInstructor && !!correctAnswer);
</script>

<div class="simple-cloze-print">
  {#if prompt}
    <div class="simple-cloze-print-prompt">{@html prompt}</div>
  {/if}

  <div class="simple-cloze-print-response">
    {#if showAnswerKey}
      <span class="simple-cloze-print-key-label">Correct answer:</span>
      <span class="simple-cloze-print-blank simple-cloze-print-blank--key">{correctAnswer}</span>
    {:else}
      <span class="simple-cloze-print-blank" role="img" aria-label="Answer blank"></span>
    {/if}
  </div>
</div>

<style>
  /* Self-contained: print players ship no Tailwind or CSS reset. */
  .simple-cloze-print {
    padding: 1rem;
    color: var(--pie-text, black);
  }

  .simple-cloze-print-prompt {
    margin-bottom: 1rem;
  }

  .simple-cloze-print-prompt :global(p) {
    margin: 0.5em 0;
  }

  .simple-cloze-print-prompt :global(strong) {
    font-weight: 600;
  }

  .simple-cloze-print-response {
    display: inline-flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .simple-cloze-print-key-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
  }

  .simple-cloze-print-blank {
    display: inline-block;
    min-width: 12rem;
    min-height: 1.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--pie-text, black);
  }

  .simple-cloze-print-blank--key {
    min-width: 6rem;
    font-weight: 600;
  }

  @media print {
    .simple-cloze-print {
      padding: 0;
    }
  }
</style>
