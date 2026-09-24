<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      session: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
import { forwardSessionChange } from '@pie-lib/delivery-events-svelte';
import { t, tCommon } from '../i18n';

let { model = null, session = null }: { model?: any; session?: any } = $props();

// Per-instance ids: a page can hold several instances, and several versions of
// this element, each with its own Svelte runtime.
const instanceId = `simple-cloze-${Math.random().toString(36).slice(2, 10)}`;
const promptId = `${instanceId}-prompt`;
const feedbackId = `${instanceId}-feedback`;

let inputElement: HTMLInputElement | null = $state(null);
let showCorrectAnswer = $state(false);

const isEvaluateMode = $derived(model?.mode === 'evaluate');
const correctness = $derived(model?.correctness);
const isCorrect = $derived(correctness === 'correct');
const isIncorrect = $derived(correctness === 'incorrect');
const correctAnswer = $derived(typeof model?.correctAnswer === 'string' ? model.correctAnswer : '');
const sessionResponse = $derived(typeof session?.response === 'string' ? session.response : '');
const canShowCorrectAnswer = $derived(isEvaluateMode && isIncorrect && !!correctAnswer.trim());
const showingCorrectAnswer = $derived(showCorrectAnswer && canShowCorrectAnswer);

const feedbackText = $derived.by(() => {
  if (!isEvaluateMode) return '';
  if (showingCorrectAnswer) return t('correctAnswerShown', model?.language);
  if (isCorrect) return t('correct', model?.language);
  if (isIncorrect) return t('incorrect', model?.language);
  return '';
});

// Leaving evaluate mode, or a response that is no longer incorrect, turns the
// reveal off, so gather mode never starts on the answer key.
$effect(() => {
  if (!canShowCorrectAnswer) {
    showCorrectAnswer = false;
  }
});

// The input shows the session response, or the answer key while it is revealed.
// A player that resets or replaces the session clears or restores it.
$effect(() => {
  if (!inputElement) return;
  const next = showingCorrectAnswer ? correctAnswer : sessionResponse;
  if (inputElement.value !== next) {
    inputElement.value = next;
  }
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const newValue = target.value;

  // The player owns the session's `id` and `element` (the versioned tag it
  // registered this element under), so neither is written here.
  forwardSessionChange({
    sourceEl: target,
    session: { ...session, response: newValue },
    complete: newValue.trim().length > 0,
  });
}

function toggleCorrectAnswer() {
  if (!canShowCorrectAnswer) return;
  showCorrectAnswer = !showCorrectAnswer;
}
</script>

<div class="simple-cloze-root">
  {#if model?.prompt}
    <div id={promptId} class="simple-cloze-prompt">{@html model.prompt}</div>
  {/if}

  {#if canShowCorrectAnswer}
    <button
      type="button"
      class="simple-cloze-toggle"
      onclick={toggleCorrectAnswer}
      aria-pressed={showingCorrectAnswer}
    >
      <span class="simple-cloze-toggle-icon" aria-hidden="true">
        {#if showingCorrectAnswer}
          <svg preserveAspectRatio="xMinYMin meet" version="1.1" viewBox="-283 359 34 35" focusable="false">
            <circle cx="-266" cy="375.9" r="14" fill="#bce2ff" />
            <path d="M-280.5,375.9c0-8,6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5s-6.5,14.5-14.5,14.5S-280.5,383.9-280.5,375.9z M-279.5,375.9c0,7.4,6.1,13.5,13.5,13.5c7.4,0,13.5-6.1,13.5-13.5s-6.1-13.5-13.5-13.5C-273.4,362.4-279.5,368.5-279.5,375.9z" fill="#bce2ff" />
            <polygon points="-265.4,383.1 -258.6,377.2 -261.2,374.2 -264.3,376.9 -268.9,368.7 -272.4,370.6" fill="#1a9cff" />
          </svg>
        {:else}
          <svg preserveAspectRatio="xMinYMin meet" version="1.1" viewBox="-129.5 127 34 35" focusable="false">
            <path style="fill: #D0CAC5; stroke: #E6E3E0; stroke-width: 0.75; stroke-miterlimit: 10;" d="M-112.9,160.4c-8.5,0-15.5-6.9-15.5-15.5c0-8.5,6.9-15.5,15.5-15.5s15.5,6.9,15.5,15.5 C-97.4,153.5-104.3,160.4-112.9,160.4z" />
            <path style="fill: #B3ABA4; stroke: #CDC7C2; stroke-width: 0.5; stroke-miterlimit: 10;" d="M-113.2,159c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-105.2,159-113.2,159z" />
            <circle cx="-114.2" cy="143.5" r="14" fill="white" />
            <path d="M-114.2,158c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-106.2,158-114.2,158z M-114.2,130c-7.4,0-13.5,6.1-13.5,13.5s6.1,13.5,13.5,13.5s13.5-6.1,13.5-13.5S-106.8,130-114.2,130z" fill="#bce2ff" />
            <polygon points="-114.8,150.7 -121.6,144.8 -119,141.8 -115.9,144.5 -111.3,136.3 -107.8,138.2" fill="#1a9cff" />
          </svg>
        {/if}
      </span>
      <span class="simple-cloze-toggle-label">
        {tCommon(showingCorrectAnswer ? 'hideCorrectAnswer' : 'showCorrectAnswer', model?.language)}
      </span>
    </button>
  {/if}

  <div class="simple-cloze-response">
    {#if isEvaluateMode && (isCorrect || showingCorrectAnswer)}
      <span class="correctness-icon correctness-icon--correct" aria-hidden="true">
        <svg fill="currentColor" viewBox="0 0 24 24" focusable="false">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </span>
    {:else if isEvaluateMode && isIncorrect}
      <span class="correctness-icon correctness-icon--incorrect" aria-hidden="true">
        <svg fill="currentColor" viewBox="0 0 24 24" focusable="false">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
      </span>
    {/if}
    <input
      bind:this={inputElement}
      type="text"
      class="simple-cloze-input"
      class:simple-cloze-input--correct={isEvaluateMode && (isCorrect || showingCorrectAnswer)}
      class:simple-cloze-input--incorrect={isEvaluateMode && isIncorrect && !showingCorrectAnswer}
      placeholder={t('placeholder', model?.language)}
      spellcheck="false"
      aria-labelledby={model?.prompt ? promptId : undefined}
      aria-label={model?.prompt ? undefined : t('answerInput', model?.language)}
      aria-describedby={feedbackText ? feedbackId : undefined}
      disabled={model?.disabled}
      readonly={showingCorrectAnswer}
      oninput={handleInput}
    />
    <span id={feedbackId} class="sr-only" role="status">{feedbackText}</span>
  </div>
</div>

<style>
  /*
   * Self-contained: players ship no Tailwind, so nothing here relies on host
   * utility classes or a CSS reset. Colours are `--pie-*` theme variables with
   * the fallbacks `@pie-lib/render-ui`'s `color` module uses.
   */
  .simple-cloze-root {
    padding: 1rem;
    color: var(--pie-text, black);
  }

  .simple-cloze-prompt {
    margin-bottom: 1rem;
  }

  .simple-cloze-prompt :global(p) {
    margin: 0.5em 0;
  }

  .simple-cloze-prompt :global(strong) {
    font-weight: 600;
  }

  .simple-cloze-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    user-select: none;
  }

  .simple-cloze-toggle:hover .simple-cloze-toggle-label {
    text-decoration: underline;
  }

  .simple-cloze-toggle:focus-visible {
    outline: 2px solid var(--pie-button-focus-outline, #3b82f6);
    outline-offset: 2px;
  }

  .simple-cloze-toggle-icon {
    display: inline-flex;
  }

  .simple-cloze-toggle-icon svg {
    width: 25px;
    height: 25px;
  }

  .simple-cloze-toggle-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .simple-cloze-response {
    position: relative;
    display: inline-block;
  }

  .simple-cloze-input {
    box-sizing: border-box;
    margin: 0;
    padding: 0.5rem 0.75rem;
    /* The text colour, as ECR's input border: a light grey fails 3:1 (WCAG 1.4.11). */
    border: 1px solid var(--pie-text, black);
    border-radius: 0.25rem;
    background-color: transparent;
    color: var(--pie-text, black);
    font: inherit;
  }

  .simple-cloze-input:disabled {
    opacity: 1;
    color: var(--pie-text, black);
    -webkit-text-fill-color: currentColor;
  }

  .simple-cloze-input:focus-visible {
    outline: 2px solid var(--pie-button-focus-outline, #3b82f6);
    outline-offset: 2px;
  }

  .simple-cloze-input--correct {
    border: 2px solid var(--pie-correct-tertiary, #0ea449);
  }

  .simple-cloze-input--incorrect {
    border: 2px solid var(--pie-incorrect-icon, #bf0d00);
  }

  .simple-cloze-input[readonly] {
    font-weight: 600;
  }

  .correctness-icon {
    position: absolute;
    top: -8px;
    left: -8px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    color: var(--pie-white, #ffffff);
  }

  .correctness-icon svg {
    width: 12px;
    height: 12px;
  }

  .correctness-icon--correct {
    background-color: var(--pie-correct-tertiary, #0ea449);
  }

  .correctness-icon--incorrect {
    background-color: var(--pie-incorrect-icon, #bf0d00);
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
