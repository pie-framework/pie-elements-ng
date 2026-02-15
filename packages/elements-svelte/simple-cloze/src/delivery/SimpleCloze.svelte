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
import { onMount } from 'svelte';

// Props using $props() in Svelte 5 custom element mode
let props = $props<{ model?: any; session?: any }>();

let inputElement: HTMLInputElement | null = null;
let showCorrectAnswer = $state(false);

onMount(() => {
  if (inputElement) {
    // Set initial value from session
    inputElement.value = props?.session?.response || '';

    inputElement.addEventListener('input', handleInput);
  }

  return () => {
    if (inputElement) {
      inputElement.removeEventListener('input', handleInput);
    }
  };
});

// Update input value when session changes externally
$effect(() => {
  if (inputElement && !showCorrectAnswer) {
    const sessionValue = props?.session?.response || '';
    if (inputElement.value !== sessionValue) {
      inputElement.value = sessionValue;
    }
  }
});

// Update input value when showing correct answer
$effect(() => {
  if (inputElement) {
    if (showCorrectAnswer && props?.model?.correctAnswer) {
      inputElement.value = props.model.correctAnswer;
    } else if (!showCorrectAnswer) {
      inputElement.value = props?.session?.response || '';
    }
  }
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const newValue = target.value;

  // Create updated session
  const updatedSession = {
    ...props.session,
    response: newValue,
  };

  // Find the host custom element
  const hostElement = target.closest('simple-cloze') as any;
  if (hostElement?._internalSession) {
    hostElement._internalSession = updatedSession;
  }

  // Dispatch custom event for web component
  const customEvent = new CustomEvent('session-changed', {
    bubbles: true,
    composed: true,
    detail: { complete: true, component: 'simple-cloze' },
  });
  hostElement?.dispatchEvent(customEvent);
}

function toggleCorrectAnswer() {
  showCorrectAnswer = !showCorrectAnswer;
}

// Computed values
const isEvaluateMode = $derived(props?.model?.env?.mode === 'evaluate');
const correctness = $derived(props?.model?.correctness);
const isCorrect = $derived(correctness === 'correct');
const isIncorrect = $derived(correctness === 'incorrect');
</script>

<div class="p-4">
  {#if props?.model?.prompt}
    <div class="mb-4 prose">{@html props.model.prompt}</div>
  {/if}

  {#if isEvaluateMode && isIncorrect}
    <button
      type="button"
      class="mb-3 flex items-center gap-2 cursor-pointer select-none"
      onclick={toggleCorrectAnswer}
      aria-pressed={showCorrectAnswer}
    >
      {#if showCorrectAnswer}
        <!-- Hide correct answer icon (open state) -->
        <svg style="width: 25px; height: 25px;" preserveAspectRatio="xMinYMin meet" version="1.1" viewBox="-283 359 34 35">
          <circle cx="-266" cy="375.9" r="14" fill="#bce2ff" />
          <path d="M-280.5,375.9c0-8,6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5s-6.5,14.5-14.5,14.5S-280.5,383.9-280.5,375.9z M-279.5,375.9c0,7.4,6.1,13.5,13.5,13.5c7.4,0,13.5-6.1,13.5-13.5s-6.1-13.5-13.5-13.5C-273.4,362.4-279.5,368.5-279.5,375.9z" fill="#bce2ff" />
          <polygon points="-265.4,383.1 -258.6,377.2 -261.2,374.2 -264.3,376.9 -268.9,368.7 -272.4,370.6" fill="#1a9cff" />
        </svg>
      {:else}
        <!-- Show correct answer icon (closed state) -->
        <svg style="width: 25px; height: 25px;" preserveAspectRatio="xMinYMin meet" version="1.1" viewBox="-129.5 127 34 35">
          <path style="fill: #D0CAC5; stroke: #E6E3E0; stroke-width: 0.75; stroke-miterlimit: 10;" d="M-112.9,160.4c-8.5,0-15.5-6.9-15.5-15.5c0-8.5,6.9-15.5,15.5-15.5s15.5,6.9,15.5,15.5 C-97.4,153.5-104.3,160.4-112.9,160.4z" />
          <path style="fill: #B3ABA4; stroke: #CDC7C2; stroke-width: 0.5; stroke-miterlimit: 10;" d="M-113.2,159c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-105.2,159-113.2,159z" />
          <circle cx="-114.2" cy="143.5" r="14" fill="white" />
          <path d="M-114.2,158c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-106.2,158-114.2,158z M-114.2,130c-7.4,0-13.5,6.1-13.5,13.5s6.1,13.5,13.5,13.5s13.5-6.1,13.5-13.5S-106.8,130-114.2,130z" fill="#bce2ff" />
          <polygon points="-114.8,150.7 -121.6,144.8 -119,141.8 -115.9,144.5 -111.3,136.3 -107.8,138.2" fill="#1a9cff" />
        </svg>
      {/if}
      <span class="text-sm hover:underline">
        {showCorrectAnswer ? 'Hide' : 'Show'} correct answer
      </span>
    </button>
  {/if}

  <div class="relative inline-block">
    {#if isEvaluateMode && (isCorrect || showCorrectAnswer)}
      <span class="correctness-icon" style="background-color: #0EA449;">
        <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </span>
    {/if}
    {#if isEvaluateMode && isIncorrect && !showCorrectAnswer}
      <span class="correctness-icon" style="background-color: #BF0D00;">
        <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
      </span>
    {/if}
    <input
      bind:this={inputElement}
      type="text"
      placeholder="Enter your answer..."
      disabled={props?.model?.disabled}
      readonly={showCorrectAnswer}
      class="outline-none px-3 py-2 rounded"
      style:border={isEvaluateMode && (isCorrect || showCorrectAnswer) ? 'solid 2px #0EA449' : isEvaluateMode && isIncorrect && !showCorrectAnswer ? 'solid 2px #BF0D00' : 'solid 1px #d1d5db'}
      style:color={isEvaluateMode && (isCorrect || isIncorrect) ? 'black' : ''}
    />
  </div>
</div>

<style>
  /* Custom styles for correct answer display */
  input[readonly] {
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
  }
</style>
