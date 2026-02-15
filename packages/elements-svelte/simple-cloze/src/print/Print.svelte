<script lang="ts">
import { onMount } from 'svelte';

// Destructure props so Svelte can infer what to expose as custom element properties
let { model = null }: { model?: any } = $props();

let prompt = $state('');

onMount(() => {
  prompt = model?.prompt || '';
});
</script>

<div class="p-4 print:p-0">
  {#if prompt}
    <div class="mb-4 prose prose-sm">{@html prompt}</div>
  {/if}

  <div class="inline-block">
    <input
      type="text"
      placeholder="______________________"
      class="px-3 py-2 border-b-2 border-gray-400 bg-transparent print:border-black"
      style="border-top: none; border-left: none; border-right: none;"
      disabled
    />
  </div>
</div>

<style>
  @media print {
    input {
      border-color: black !important;
    }
  }

  .prose :global(p) {
    margin: 0.5em 0;
  }
  .prose :global(strong) {
    font-weight: 600;
  }
</style>
