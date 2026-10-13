<script lang="ts">
import { sanitizeModelHtml } from '@pie-element/shared-utils';
import { t } from './i18n';

interface DisplayChoice {
  imageUrl?: string;
  imageAlt?: string;
  labelHtml?: string;
}

let {
  choiceMode = 'text',
  choices = [],
  displayChoice = undefined,
  displayChoiceLabelHtml = '',
  isStandalone = false,
  blankWidth,
  blankBorderWidth,
  ariaLabel,
  language,
}: {
  choiceMode?: 'text' | 'image';
  choices?: DisplayChoice[];
  displayChoice?: DisplayChoice;
  displayChoiceLabelHtml?: string;
  isStandalone?: boolean;
  blankWidth: string;
  blankBorderWidth: string;
  ariaLabel: string;
  language?: string;
} = $props();

const isImage = (c: DisplayChoice | undefined) => choiceMode === 'image' && !!c?.imageUrl;
const sizers = $derived(choices.filter((c) => isImage(c) || !!c?.labelHtml));
</script>

<span
  class={`cloze-marker pie-blank-slot ${isStandalone ? 'cloze-marker-standalone pie-blank-slot-standalone' : ''}`}
  style={`width:${blankWidth};border-bottom-width:${blankBorderWidth};`}
  role="status"
  aria-live="polite"
  aria-atomic="true"
  aria-label={ariaLabel}
>
  {#if isImage(displayChoice)}
    <img
      src={displayChoice?.imageUrl}
      alt={displayChoice?.imageAlt || t('selectedAnswerImage', language)}
      class="cloze-marker-image pie-blank-image"
      style="max-width:var(--mpb-choice-image-max-width, 9.375rem);max-height:var(--mpb-choice-image-max-height, 9.375rem);"
    />
  {:else if displayChoiceLabelHtml}
    <span class="cloze-marker-value pie-blank-value">{@html sanitizeModelHtml(displayChoiceLabelHtml)}</span>
  {:else}
    <span class="cloze-marker-empty">
      <span aria-hidden="true">&nbsp;</span>
      <span class="sr-only">{t('emptyBlank', language)}</span>
    </span>
  {/if}
  {#if sizers.length}
    <span class="cloze-marker-sizers pie-blank-sizers" aria-hidden="true">
      {#each sizers as c}
        {#if isImage(c)}
          <img
            src={c.imageUrl}
            alt=""
            class="cloze-marker-image pie-blank-image"
            style="max-width:var(--mpb-choice-image-max-width, 9.375rem);max-height:var(--mpb-choice-image-max-height, 9.375rem);"
          />
        {:else}
          <span class="cloze-marker-value pie-blank-value">{@html sanitizeModelHtml(c.labelHtml || '')}</span>
        {/if}
      {/each}
    </span>
  {/if}
</span>

<style>
  /* The underline width comes from the inline style (layoutLimits); the colour
     follows the text. The answer and a hidden copy of every choice share one grid
     cell, so the blank holds the largest choice's box from the start and nothing
     around it moves on selection; the copies keep the empty placeholder's 4ch
     minimum too. The answer comes first: it gives the blank its baseline. The
     minmax(0, 1fr) tracks keep a fixed-size blank at its size, so an answer
     taller than it overflows evenly, as in a flex box (sel-r1-base.css). */
  .cloze-marker {
    display: inline-grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    align-items: center;
    justify-items: center;
    text-align: center;
    vertical-align: baseline;
    padding-inline: 0.5rem;
    border-bottom: 2px solid currentColor;
  }

  .cloze-marker:focus-within {
    outline: 2px solid var(--mpb-focus-ring, #1565c0);
    outline-offset: 2px;
  }

  /* :global, because a host may wrap an answer image in its own element. */
  .cloze-marker > :global(*),
  .cloze-marker-sizers > :global(*) {
    grid-area: 1 / 1;
  }

  .cloze-marker-sizers {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    align-self: stretch;
    justify-self: stretch;
    min-width: 4ch;
    visibility: hidden;
    pointer-events: none;
  }

  .cloze-marker-standalone {
    width: var(--mpb-blank-standalone-width, 7rem);
  }

  .cloze-marker-image {
    object-fit: contain;
  }

  .cloze-marker-empty {
    display: inline-block;
    min-width: 4ch;
  }

  .cloze-marker-value {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .cloze-marker-value :global(p) {
    margin: 0;
  }

  /* Same 150x150 content-element constraint as ChoiceRow.svelte's .choice-html
     img — the selected choice's raw labelHtml can carry an embedded <img> here
     too, regardless of customType. See CONTOOL-3159. */
  .cloze-marker-value :global(img) {
    width: 150px;
    height: 150px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
