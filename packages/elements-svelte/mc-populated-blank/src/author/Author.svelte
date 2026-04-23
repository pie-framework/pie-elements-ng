<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
// Keep the same prop shape expected by the wrapper.
let { model = $bindable(), onChange }: { model?: any; onChange?: (model: any) => void } = $props();
</script>

<div class="mc-populated-blank-author-placeholder" role="status" aria-live="polite">
  <p class="title">Author view placeholder</p>
  <p class="body">This authoring interface is a placeholder and will be implemented later.</p>
</div>

<style>
  .mc-populated-blank-author-placeholder {
    max-width: 56rem;
    margin: 24px auto;
    padding: 20px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #f8fafc;
    color: #334155;
  }

  .title {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 600;
  }

  .body {
    margin: 0;
    font-size: 0.9rem;
  }
</style>
