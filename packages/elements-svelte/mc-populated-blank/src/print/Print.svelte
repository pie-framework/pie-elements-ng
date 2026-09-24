<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      options: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
import { t as translate } from '../delivery/i18n';

const BLANK_TOKEN = '{{blank}}';

let { model = null, options = null }: { model?: any; options?: any } = $props();

// `pie-print` hands over the item's own model, so the controller's `language` fallback is repeated here.
const t = (key: string) => translate(key, model?.language || model?.locale || undefined);

const prompt = $derived(model?.promptEnabled !== false ? model?.prompt || '' : '');
const template = $derived(model?.template || '');

const parts = $derived.by(() => {
  const idx = template.indexOf(BLANK_TOKEN);
  if (idx < 0) return { before: template, after: '' };
  return { before: template.slice(0, idx), after: template.slice(idx + BLANK_TOKEN.length) };
});

const choices = $derived(Array.isArray(model?.choices) ? model.choices : []);
const correct = $derived(choices.find((c: any) => c?.id === model?.correctChoiceId));
const mode = $derived(model?.choiceMode || 'text');
const isAudioOnlyMode = $derived(model?.interactionMode === 'audio_mc_only');
// The key and teacher instructions are the instructor's, as multiple-choice prints them.
const isInstructor = $derived(options?.role === 'instructor');
const showAnswerKey = $derived(isInstructor && model?.printAnswerKey !== false);
const teacherInstructions = $derived(
  isInstructor && model?.teacherInstructionsEnabled !== false
    ? model?.teacherInstructions || ''
    : ''
);
</script>

<div class="mpb-print">
  {#if teacherInstructions}
    <div class="mpb-print-block mpb-print-prose mpb-print-teacher-instructions">{@html teacherInstructions}</div>
  {/if}

  {#if prompt}
    <div class="mpb-print-block mpb-print-prose">{@html prompt}</div>
  {/if}

  {#if model?.sentenceHtml}
    <div class="mpb-print-sentence mpb-print-prose">{@html model.sentenceHtml}</div>
  {/if}

  {#if !isAudioOnlyMode}
    <div class="mpb-print-block mpb-print-prose">
      {@html parts.before}
      <span class="mpb-print-blank">
        {#if showAnswerKey && mode === 'image' && correct?.imageUrl}
          <img class="mpb-print-choice-image" src={correct.imageUrl} alt={correct.imageAlt || ''} />
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
    <div class="mpb-print-block mpb-print-small">
      {#if model?.audioUrl}
        <div><strong>{t('printAudio')}</strong> {model.audioUrl}</div>
      {/if}
      {#if model?.audioTranscript}
        <div><strong>{t('printTranscript')}</strong> {model.audioTranscript}</div>
      {/if}
    </div>
  {/if}

  <ul class="mpb-print-choices mpb-print-small">
    {#each choices as c}
      <li>
        {#if mode === 'image'}
          {#if c.imageUrl}
            <img class="mpb-print-choice-image" src={c.imageUrl} alt={c.imageAlt || ''} />
          {/if}
        {:else}
          {@html c.labelHtml || ''}
        {/if}
        {#if showAnswerKey && c.id === model?.correctChoiceId}
          <span class="mpb-print-key"> {t('printKey')}</span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .mpb-print {
    padding: 1rem;
  }

  .mpb-print-block {
    margin-bottom: 1rem;
  }

  .mpb-print-sentence {
    margin-bottom: 0.5rem;
  }

  .mpb-print-prose {
    font-size: 0.875rem;
    line-height: 1.7142857;
  }

  .mpb-print-prose :global(p) {
    margin: 0.5em 0;
  }

  .mpb-print-prose :global(strong) {
    font-weight: 600;
  }

  .mpb-print-small {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .mpb-print-blank {
    display: inline-block;
    min-width: 6rem;
    padding: 0 0.25rem;
    border-bottom: 2px solid var(--pie-text, #4b5563);
  }

  .mpb-print-choice-image {
    max-height: 3.5rem;
    object-fit: contain;
    vertical-align: middle;
  }

  .mpb-print-choices {
    margin: 0;
    padding-left: 1.25rem;
    list-style: disc;
  }

  .mpb-print-key {
    font-weight: 500;
  }

  @media print {
    .mpb-print {
      padding: 0;
    }

    .mpb-print-blank {
      border-bottom-color: #000;
    }
  }
</style>
