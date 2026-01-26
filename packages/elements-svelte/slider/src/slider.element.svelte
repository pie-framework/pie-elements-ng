<script lang="ts">
/**
 * Slider Web Component Core
 *
 * Pure Svelte component without auto-registration
 * Registration handled by wrapper to prevent duplicate registration errors
 */

import type { SliderModel, SliderSession, SliderEvaluation, PieEnvironment } from './slider.types.js';
import { formatValue, normalizeValue } from './slider.controller.js';

interface Props {
  model?: SliderModel | string;
  session?: SliderSession | string;
  env?: PieEnvironment | string;
  evaluation?: SliderEvaluation | string;
}

let { model = $bindable(), session = $bindable(), env = $bindable(), evaluation = $bindable() }: Props = $props();

// Parse props that may be JSON strings (web component usage)
function parseJsonProp<T>(prop: T | string | undefined): T | null {
  if (!prop) return null;
  if (typeof prop === 'string') {
    try {
      return JSON.parse(prop);
    } catch {
      return null;
    }
  }
  return prop;
}

const parsedModel = $derived(parseJsonProp<SliderModel>(model));
const parsedSession = $derived(parseJsonProp<SliderSession>(session));
const parsedEnv = $derived(parseJsonProp<PieEnvironment>(env));
const parsedEvaluation = $derived(parseJsonProp<SliderEvaluation>(evaluation));

// Get reference to root element for event dispatching
let rootElement: HTMLDivElement | undefined = $state();

// Reactive computed values
const isDisabled = $derived(parsedEnv?.mode === 'view' || parsedEnv?.mode === 'evaluate');
const showRationale = $derived(
  parsedEnv?.mode === 'evaluate' &&
    parsedEnv?.role === 'instructor' &&
    parsedModel?.rationaleEnabled &&
    parsedModel?.rationale
);
const showEvaluation = $derived(parsedEnv?.mode === 'evaluate' && parsedEvaluation);

// Current value with safe fallback
const currentValue = $derived(
  typeof parsedSession?.value === 'number' ? parsedSession.value : (parsedModel?.lowerBound ?? 0)
);
const formattedValue = $derived(parsedModel ? formatValue(currentValue, parsedModel) : '0');

// Handle slider change
function handleChange(event: Event) {
  if (isDisabled || !parsedModel) return;

  const target = event.target as HTMLInputElement;
  const rawValue = parseFloat(target.value);
  const normalizedValue = normalizeValue(rawValue, parsedModel);

  // Update the session
  const newSession = { value: normalizedValue };
  session = newSession;

  // Dispatch custom event for element player
  if (rootElement) {
    rootElement.dispatchEvent(
      new CustomEvent('session-changed', {
        detail: newSession,
        bubbles: true,
        composed: true,
      })
    );
  }
}

// Evaluation status class
const evaluationClass = $derived(() => {
  if (!parsedEvaluation) return '';
  if (parsedEvaluation.correct) return 'correct';
  if (parsedEvaluation.partialCredit && parsedEvaluation.partialCredit > 0) return 'partial';
  return 'incorrect';
});
</script>

<div bind:this={rootElement} class="pie-slider" class:disabled={isDisabled} class:evaluated={showEvaluation}>
  {#if !parsedModel}
    <div class="error">No model data provided</div>
  {:else}
    {#if parsedModel.promptEnabled && parsedModel.prompt}
      <div class="prompt">
        {@html parsedModel.prompt}
      </div>
    {/if}

    <div class="slider-container">
      <div class="slider-wrapper">
        <!-- Min label -->
        <span class="bound-label min-label" aria-hidden="true">
          {parsedModel.lowerBound}
        </span>

        <!-- Slider input -->
        <input
          type="range"
          class="slider-input {evaluationClass()}"
          min={parsedModel.lowerBound}
          max={parsedModel.upperBound}
          step={parsedModel.step ?? 1}
          value={currentValue}
          disabled={isDisabled}
          aria-label={parsedModel.prompt
            ? parsedModel.prompt.replace(/<[^>]*>/g, '')
            : 'Slider value selector'}
          aria-valuemin={parsedModel.lowerBound}
          aria-valuemax={parsedModel.upperBound}
          aria-valuenow={currentValue}
          aria-valuetext={formattedValue}
          oninput={handleChange}
        />

        <!-- Max label -->
        <span class="bound-label max-label" aria-hidden="true">
          {parsedModel.upperBound}
        </span>
      </div>

      <!-- Current value display -->
      <div class="value-display" aria-live="polite" aria-atomic="true">
        <div class="value-label">Current value:</div>
        <div class="value-number">{formattedValue}</div>
      </div>
    </div>

    <!-- Evaluation feedback -->
    {#if showEvaluation && parsedEvaluation}
      <div class="response-indicator {evaluationClass()}" role="status" aria-live="polite">
        {#if parsedEvaluation.correct}
          <span class="status-icon">✓</span>
          <span class="status-text">Correct!</span>
        {:else if parsedEvaluation.partialCredit && parsedEvaluation.partialCredit > 0}
          <span class="status-icon">◐</span>
          <span class="status-text">
            Partially correct ({Math.round(parsedEvaluation.partialCredit * 100)}% credit)
          </span>
          {#if parsedEvaluation.difference !== undefined}
            <span class="difference">
              Off by {formatValue(parsedEvaluation.difference, parsedModel)}
            </span>
          {/if}
        {:else}
          <span class="status-icon">✗</span>
          <span class="status-text">Incorrect</span>
          {#if parsedEvaluation.difference !== undefined}
            <span class="difference">
              Off by {formatValue(parsedEvaluation.difference, parsedModel)}
            </span>
          {/if}
        {/if}

        {#if parsedEnv?.role === 'instructor' && parsedModel.correctResponse !== undefined}
          <div class="correct-answer">
            Correct answer: {formatValue(parsedModel.correctResponse, parsedModel)}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Rationale (instructor only) -->
    {#if showRationale}
      <div class="rationale">
        <strong>Rationale:</strong>
        {@html parsedModel.rationale}
      </div>
    {/if}
  {/if}
</div>

<style>
  .pie-slider {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 600px;
    margin: 0 auto;
  }

  .error {
    padding: 1rem;
    background-color: #fee2e2;
    color: #991b1b;
    border-radius: 0.5rem;
  }

  .prompt {
    margin-bottom: 1rem;
    font-size: 1rem;
    line-height: 1.5;
  }

  .slider-container {
    margin: 1.5rem 0;
  }

  .slider-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .bound-label {
    font-size: 0.875rem;
    color: #4b5563;
    font-weight: 500;
    min-width: 3ch;
  }

  /* Native range input with accessibility */
  .slider-input {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: #e5e7eb;
    border-radius: 4px;
    outline: none;
    cursor: pointer;
  }

  .slider-input:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Focus visible (WCAG 2.2 requirement) */
  .slider-input:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Webkit slider thumb */
  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: all 0.15s ease;
  }

  .slider-input::-webkit-slider-thumb:hover:not(:disabled) {
    background: #2563eb;
    transform: scale(1.1);
  }

  .slider-input::-webkit-slider-thumb:active:not(:disabled) {
    transform: scale(0.95);
  }

  /* Firefox slider thumb */
  .slider-input::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: all 0.15s ease;
  }

  .slider-input::-moz-range-thumb:hover:not(:disabled) {
    background: #2563eb;
    transform: scale(1.1);
  }

  .slider-input::-moz-range-thumb:active:not(:disabled) {
    transform: scale(0.95);
  }

  /* Evaluation state colors */
  .slider-input.correct::-webkit-slider-thumb {
    background: #10b981;
  }

  .slider-input.incorrect::-webkit-slider-thumb {
    background: #ef4444;
  }

  .slider-input.partial::-webkit-slider-thumb {
    background: #f59e0b;
  }

  .slider-input.correct::-moz-range-thumb {
    background: #10b981;
  }

  .slider-input.incorrect::-moz-range-thumb {
    background: #ef4444;
  }

  .slider-input.partial::-moz-range-thumb {
    background: #f59e0b;
  }

  /* Value display */
  .value-display {
    margin-top: 1rem;
    text-align: center;
    display: inline-block;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
  }

  .value-label {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .value-number {
    font-weight: 700;
    font-size: 1.25rem;
    color: #3b82f6;
  }

  /* Response indicator */
  .response-indicator {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .response-indicator.correct {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
  }

  .response-indicator.incorrect {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
  }

  .response-indicator.partial {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #f59e0b;
  }

  .status-icon {
    font-size: 1.25rem;
  }

  .difference {
    margin-left: auto;
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .correct-answer {
    width: 100%;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid currentColor;
    opacity: 0.8;
    font-size: 0.875rem;
  }

  /* Rationale */
  .rationale {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f3f4f6;
    border-left: 4px solid #3b82f6;
    border-radius: 0.25rem;
  }

  .rationale strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #1f2937;
  }

  /* Disabled state */
  .pie-slider.disabled {
    opacity: 0.7;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .pie-slider {
      max-width: 100%;
    }

    .slider-wrapper {
      gap: 0.5rem;
    }

    .bound-label {
      font-size: 0.75rem;
    }
  }
</style>
