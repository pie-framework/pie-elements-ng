<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
const BLANK_TOKEN = '{{blank}}';

let { model = null }: { model?: any } = $props();

let prompt = $state('');
let template = $state('');
$effect(() => {
  prompt = model?.prompt || '';
  template = model?.template || '';
});

const parts = $derived.by(() => {
  const idx = template.indexOf(BLANK_TOKEN);
  if (idx < 0) return { before: template, after: '' };
  return { before: template.slice(0, idx), after: template.slice(idx + BLANK_TOKEN.length) };
});

const choices = $derived(Array.isArray(model?.choices) ? model.choices : []);
const correct = $derived(model?.choices?.find((c: any) => c.id === model?.correctChoiceId));
const mode = $derived(model?.choiceMode || 'text');
const isAudioOnlyMode = $derived(model?.interactionMode === 'audio_mc_only');
const showAnswerKey = $derived(model?.printAnswerKey !== false);
</script>

<div class="p-4 print:p-0">
  {#if prompt && model?.promptEnabled !== false}
    <div class="mb-4 prose prose-sm">{@html prompt}</div>
  {/if}

  {#if model?.sentenceHtml}
    <div class="mb-2 prose prose-sm">{@html model.sentenceHtml}</div>
  {/if}

  {#if !isAudioOnlyMode}
    <div class="mb-4 prose prose-sm">
      {@html parts.before}
      <span class="inline-block min-w-[6rem] border-b-2 border-gray-600 print:border-black px-1">
        {#if showAnswerKey && mode === 'image' && correct?.imageUrl}
          <img src={correct.imageUrl} alt={correct.imageAlt || ''} class="max-h-14 object-contain" />
        {:else if showAnswerKey && correct?.labelHtml}
          {@html correct.labelHtml}
        {:else}
          ________
        {/if}
      </span>
      {@html parts.after}
    </div>
  {/if}

  {#if model?.hasAudio}
    <div class="text-sm mb-4">
      {#if model?.audioUrl}
        <div><strong>Audio:</strong> {model.audioUrl}</div>
      {/if}
      {#if model?.audioTranscript}
        <div><strong>Transcript:</strong> {model.audioTranscript}</div>
      {/if}
    </div>
  {/if}

  <ul class="text-sm list-disc pl-5">
    {#each choices as c}
      <li>
        {#if mode === 'image'}
          <span class="font-medium">{c.id}</span>
          {#if showAnswerKey && c.id === model?.correctChoiceId}(key){/if}
        {:else}
          {@html c.labelHtml || ''}
          {#if showAnswerKey && c.id === model?.correctChoiceId}
            <span class="font-medium"> (key)</span>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .prose :global(p) {
    margin: 0.5em 0;
  }
  .prose :global(strong) {
    font-weight: 600;
  }
</style>
