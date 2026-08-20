<script lang="ts">
interface DisplayChoice {
  imageUrl?: string;
  imageAlt?: string;
  labelHtml?: string;
}

let {
  choiceMode = 'text',
  displayChoice = undefined,
  displayChoiceLabelHtml = '',
  isStandalone = false,
  blankWidth,
  blankBorderWidth,
  ariaLabel,
}: {
  choiceMode?: 'text' | 'image';
  displayChoice?: DisplayChoice;
  displayChoiceLabelHtml?: string;
  isStandalone?: boolean;
  blankWidth: string;
  blankBorderWidth: string;
  ariaLabel: string;
} = $props();
</script>

<span
  class={`inline-flex items-center min-h-[1.5em] px-2 mx-1 border-b-2 border-gray-500 align-baseline cloze-marker pie-blank-slot ${isStandalone ? 'cloze-marker-standalone pie-blank-slot-standalone' : ''}`}
  style={`width:${blankWidth};border-bottom-width:${blankBorderWidth};`}
  role="status"
  aria-live="polite"
  aria-atomic="true"
  aria-label={ariaLabel}
>
  {#if choiceMode === 'image' && displayChoice?.imageUrl}
    <img
      src={displayChoice.imageUrl}
      alt={displayChoice.imageAlt || 'Selected answer image'}
      class="w-auto object-contain pie-blank-image"
      style="max-height:var(--mpb-selected-image-max-height, 4rem);"
    />
  {:else if displayChoiceLabelHtml}
    <span class="cloze-marker-value pie-blank-value">{@html displayChoiceLabelHtml}</span>
  {:else}
    <span class="cloze-marker-empty" aria-hidden="true">&nbsp;</span>
  {/if}
</span>

<style>
  .cloze-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    vertical-align: baseline;
  }

  .cloze-marker:focus-within {
    outline: 2px solid var(--mpb-focus-ring, #1565c0);
    outline-offset: 2px;
  }

  .cloze-marker-standalone {
    width: var(--mpb-blank-standalone-width, 7rem);
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
</style>
