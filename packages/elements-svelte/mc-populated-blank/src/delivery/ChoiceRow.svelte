<script lang="ts">
import { t } from './i18n';

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
  language,
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
  language?: string;
} = $props();
</script>

<div
  class={`choice-row pie-choice ${isHorizontal ? 'choice-row-horizontal pie-choice-horizontal' : ''} ${isSelected ? 'is-selected pie-choice-selected' : ''} ${correctness ? `choice-${correctness} pie-choice-${correctness}` : ''}`}
  style="gap:var(--mpb-choice-row-gap, 0.5rem);"
>
  {#if isHorizontal}
    <label
      for={`${instanceId}-opt-${choice.id}`}
      class="choice-tile pie-choice-tile"
    >
      <span class="choice-tile-content pie-choice-tile-content">
        {#if choiceMode === 'image' && choice.imageUrl}
          <img
            src={choice.imageUrl}
            alt={choice.imageAlt || t('choiceImage', language, { id: choice.id })}
            class="choice-image pie-choice-image"
            style="max-width:var(--mpb-choice-image-max-width, 9.375rem);max-height:var(--mpb-choice-image-max-height, 9.375rem);"
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
    <label for={`${instanceId}-opt-${choice.id}`} class="choice-label-wrap pie-choice-label-wrap">
      {#if choiceMode === 'image' && choice.imageUrl}
        <img
          src={choice.imageUrl}
          alt={choice.imageAlt || t('choiceImage', language, { id: choice.id })}
          class="choice-image pie-choice-image"
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
  .choice-row {
    display: flex;
    align-items: flex-start;
  }

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
    cursor: pointer;
    text-align: center;
  }

  .choice-tile-content {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--mpb-choice-content-min-height, 7.5rem);
  }

  .choice-image {
    display: block;
    object-fit: contain;
  }

  .choice-label-wrap {
    flex: 1 1 0%;
    cursor: pointer;
  }

  /* Every background painted here carries its own text colour: a variant that
     pins a light surface (the CQT sheets' #fcfcd3) would otherwise sit under
     the scheme's text colour, which is near-white in a dark scheme. With neither
     the hook nor --pie-text defined the declaration is invalid at computed-value
     time and the colour inherits. */
  .choice-row-horizontal:hover .choice-tile {
    background: var(--mpb-choice-hover-bg, var(--pie-background-dark, #ecedf1));
    color: var(--mpb-choice-hover-color, var(--pie-text));
  }

  .pie-choice-horizontal:not(.is-selected):not(:hover) .pie-choice-tile {
    background: transparent;
  }

  .choice-row-horizontal.is-selected .choice-tile {
    background: var(--mpb-choice-selected-bg, var(--pie-secondary-background, rgba(241, 241, 241, 1)));
    color: var(--mpb-choice-selected-color, var(--pie-text));
  }

  .choice-row-horizontal.is-selected:hover .choice-tile {
    background: var(--mpb-choice-selected-bg, var(--pie-secondary-background, rgba(241, 241, 241, 1)));
    color: var(--mpb-choice-selected-color, var(--pie-text));
  }

  .pie-choice:not(.pie-choice-horizontal):hover .pie-choice-label-wrap {
    background: var(--pie-background-dark, #ecedf1);
    color: var(--pie-text);
  }

  .pie-choice:not(.pie-choice-horizontal):not(.is-selected):not(:hover) .pie-choice-label-wrap {
    background: transparent;
  }

  .pie-choice:not(.pie-choice-horizontal).is-selected .pie-choice-label-wrap {
    background: var(--pie-secondary-background, rgba(241, 241, 241, 1));
    color: var(--pie-text);
    border-radius: 6px;
  }

  .pie-choice:not(.pie-choice-horizontal).is-selected:hover .pie-choice-label-wrap {
    background: var(--pie-secondary-background, rgba(241, 241, 241, 1));
    color: var(--pie-text);
  }

  .pie-choice.choice-correct {
    border-left: 3px solid var(--pie-correct-tertiary, #0ea449);
  }

  .pie-choice.choice-incorrect {
    border-left: 3px solid var(--pie-incorrect-icon, #bf0d00);
  }

  .pie-choice-horizontal.choice-correct .choice-tile {
    background: var(--pie-correct-secondary, #e8f5e9);
    color: var(--pie-text);
  }

  .pie-choice-horizontal.choice-incorrect .choice-tile {
    background: var(--pie-incorrect-secondary, #ffebee);
    color: var(--pie-text);
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
    color: var(--pie-white, #ffffff);
  }

  .pie-choice-feedback-correct {
    background: var(--pie-correct-icon, #087d38);
  }

  .pie-choice-feedback-incorrect {
    background: var(--pie-incorrect-icon, #bf0d00);
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

  /* Choices carrying raw <img> markup in labelHtml (rather than the dedicated
     imageUrl/imageAlt fields) render unconstrained at their authored size
     otherwise — 3rd-party/CQT-sourced content is typically authored well above
     the platform's 150x150 content-element spec. Applies regardless of
     customType, unlike the r1-CQT-specific cqt-css overlays. See CONTOOL-3159. */
  .choice-html :global(img) {
    width: 150px;
    height: 150px;
  }

  /* Only the top margin is spaced; the browser's own radio side margins would
     otherwise offset the control from its label (the demo app's preflight zeroed them). */
  .choice-radio-bottom {
    margin: var(--mpb-horizontal-choice-radio-top-margin, 0.5rem) 0 0;
    padding: var(--mpb-choice-radio-padding, 0px);
  }

  .choice-radio-inline {
    margin: var(--mpb-horizontal-choice-radio-top-margin, 0.5rem) 0 0;
  }
</style>
