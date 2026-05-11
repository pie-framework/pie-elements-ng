<script lang="ts">
interface Choice {
  id: string;
  labelHtml?: string;
  imageUrl?: string;
  imageAlt?: string;
}

let {
  choice,
  choiceMode = 'text',
  isHorizontal = false,
  isSelected = false,
  isDisabled = false,
  correctness = undefined,
  isEvaluateMode = false,
  instanceId,
  radioGroupName,
}: {
  choice: Choice;
  choiceMode?: 'text' | 'image';
  isHorizontal?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  correctness?: 'correct' | 'incorrect' | undefined;
  isEvaluateMode?: boolean;
  instanceId: string;
  radioGroupName: string;
} = $props();
</script>

<div
  class={`flex items-start choice-row pie-choice ${isHorizontal ? 'choice-row-horizontal pie-choice-horizontal' : ''} ${isSelected ? 'is-selected pie-choice-selected' : ''} ${correctness ? `choice-${correctness} pie-choice-${correctness}` : ''}`}
  style="gap:var(--mpb-choice-row-gap, 0.5rem);"
>
  {#if isHorizontal}
    <label
      for={`${instanceId}-opt-${choice.id}`}
      class="cursor-pointer choice-tile text-center pie-choice-tile"
    >
      <span class="choice-tile-content pie-choice-tile-content">
        {#if choiceMode === 'image' && choice.imageUrl}
          <img
            src={choice.imageUrl}
            alt={choice.imageAlt || `Choice ${choice.id}`}
            class="object-contain pie-choice-image"
            style="max-height:var(--mpb-choice-image-max-height, 5rem);"
          />
        {:else}
          <span class="choice-html pie-choice-label">{@html choice.labelHtml || ''}</span>
        {/if}
      </span>
      <input
        type="radio"
        name={radioGroupName}
        id={`${instanceId}-opt-${choice.id}`}
        value={choice.id}
        checked={isSelected}
        disabled={isDisabled}
        class="choice-radio-bottom pie-choice-radio pie-choice-radio-bottom"
      />
    </label>
  {:else}
    <input
      type="radio"
      name={radioGroupName}
      id={`${instanceId}-opt-${choice.id}`}
      value={choice.id}
      checked={isSelected}
      disabled={isDisabled}
      class="choice-radio-inline pie-choice-radio pie-choice-radio-inline"
    />
    <label for={`${instanceId}-opt-${choice.id}`} class="cursor-pointer flex-1 pie-choice-label-wrap">
      {#if choiceMode === 'image' && choice.imageUrl}
        <img
          src={choice.imageUrl}
          alt={choice.imageAlt || `Choice ${choice.id}`}
          class="object-contain pie-choice-image"
          style="max-height:var(--mpb-choice-image-max-height, 5rem);"
        />
      {:else}
        <span class="choice-html pie-choice-label">{@html choice.labelHtml || ''}</span>
      {/if}
    </label>
  {/if}
  {#if isEvaluateMode && correctness}
    <span
      class={`pie-choice-feedback-badge ${correctness === 'correct' ? 'pie-choice-feedback-correct' : 'pie-choice-feedback-incorrect'}`}
      aria-hidden="true"
    >
      {correctness === 'correct' ? '✓' : '✕'}
    </span>
  {/if}
</div>

<style>
  .choice-row-horizontal {
    flex-direction: column;
    align-items: center;
    width: min(var(--mpb-choice-width-px, 170px), var(--mpb-choice-width-vw, 30vw));
    min-height: var(--mpb-choice-tile-min-height, 11rem);
    gap: 0;
  }

  .choice-tile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: var(--mpb-choice-tile-min-height, 11rem);
    padding: 0.8rem 0.65rem 0.5rem;
    border-radius: 8px;
    background: transparent;
    transition: background-color 120ms ease-in-out;
  }

  .choice-tile-content {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--mpb-choice-content-min-height, 7.5rem);
  }

  .choice-row-horizontal:hover .choice-tile {
    background: var(--mpb-choice-hover-bg, var(--pie-correct-answer-choice-hover-bg, #f2f2f2));
  }

  .pie-choice-horizontal:not(.is-selected):not(:hover) .pie-choice-tile {
    background: transparent;
  }

  .choice-row-horizontal.is-selected .choice-tile {
    background: var(--mpb-choice-selected-bg, var(--pie-correct-answer-choice-selected-bg, #fcfcd3));
  }

  .choice-row-horizontal.is-selected:hover .choice-tile {
    background: var(--mpb-choice-selected-bg, var(--pie-correct-answer-choice-selected-bg, #fcfcd3));
  }

  .pie-choice:not(.pie-choice-horizontal):hover .pie-choice-label-wrap {
    background: var(--pie-correct-answer-choice-hover-bg, #ececec);
  }

  .pie-choice:not(.pie-choice-horizontal):not(.is-selected):not(:hover) .pie-choice-label-wrap {
    background: transparent;
  }

  .pie-choice:not(.pie-choice-horizontal).is-selected .pie-choice-label-wrap {
    background: var(--pie-correct-answer-choice-selected-bg, #f1f1f1);
    border-radius: 6px;
  }

  .pie-choice:not(.pie-choice-horizontal).is-selected:hover .pie-choice-label-wrap {
    background: var(--pie-correct-answer-choice-selected-bg, #f1f1f1);
  }

  .pie-choice.choice-correct {
    border-left: 3px solid var(--pie-correct-answer-choice-correct-border, #0ea449);
  }

  .pie-choice.choice-incorrect {
    border-left: 3px solid var(--pie-correct-answer-choice-incorrect-border, #bf0d00);
  }

  .pie-choice-horizontal.choice-correct .choice-tile {
    background: var(--pie-correct-answer-choice-correct-bg, #e8f5e9);
  }

  .pie-choice-horizontal.choice-incorrect .choice-tile {
    background: var(--pie-correct-answer-choice-incorrect-bg, #ffebee);
  }

  .pie-choice-feedback-badge {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 9999px;
    font-size: 0.72rem;
    line-height: 1;
    font-weight: 700;
    color: var(--pie-correct-answer-feedback-glyph-color, #fff);
  }

  .pie-choice-feedback-correct {
    background: var(--pie-correct-answer-feedback-correct-bg, #087d38);
  }

  .pie-choice-feedback-incorrect {
    background: var(--pie-correct-answer-feedback-incorrect-bg, #bf0d00);
  }

  .choice-row-horizontal :global(p) {
    margin: 0;
    text-align: center;
  }

  .choice-html :global(p) {
    margin: 0;
  }

  .choice-html {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .choice-radio-bottom {
    margin-top: var(--mpb-horizontal-choice-radio-top-margin, 0.5rem);
    padding: var(--mpb-choice-radio-padding, 0px);
  }

  .choice-radio-inline {
    margin-top: var(--mpb-horizontal-choice-radio-top-margin, 0.5rem);
  }
</style>
