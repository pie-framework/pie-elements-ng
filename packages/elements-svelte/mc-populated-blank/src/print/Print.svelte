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
import McPopulatedBlank from '../delivery/McPopulatedBlank.svelte';
import { t as translate } from '../delivery/i18n';
import { preparePrint, type PrintView } from './preparePrint';

let { model = null, options = null }: { model?: any; options?: any } = $props();

let view = $state<PrintView | null>(null);

$effect(() => {
  const question = model;
  const role = options?.role;
  if (!question) {
    view = null;
    return;
  }
  let current = true;
  preparePrint(question, role).then((next) => {
    if (current) view = next;
  });
  return () => {
    current = false;
  };
});

const t = (key: string) => translate(key, (view?.model.language as string) || undefined);
</script>

{#if view}
  <div class="mpb-print">
    {#if view.teacherInstructions}
      <div class="mpb-print-block mpb-print-teacher-instructions">{@html view.teacherInstructions}</div>
    {/if}

    {#if view.audioUrl || view.audioTranscript}
      <div class="mpb-print-block mpb-print-audio">
        {#if view.audioUrl}
          <div><strong>{t('printAudio')}</strong> {view.audioUrl}</div>
        {/if}
        {#if view.audioTranscript}
          <div><strong>{t('printTranscript')}</strong> {view.audioTranscript}</div>
        {/if}
      </div>
    {/if}

    <McPopulatedBlank model={view.model} session={view.session} />
  </div>
{/if}

<style>
  /* Inset to line up with the delivery root's padding. */
  .mpb-print-block {
    padding: 0 1rem;
    margin: 1rem 0;
  }

  .mpb-print-teacher-instructions :global(p) {
    margin: 0.5em 0;
  }

  .mpb-print-audio {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
</style>
