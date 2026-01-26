<script lang="ts">
/**
 * Slider Component
 *
 * WCAG 2.2 Level AA compliant slider control
 * Maps to QTI sliderInteraction
 */

import { formatValue, normalizeValue } from './slider.controller.js';
import type { SliderComponentProps } from './slider.types.js';

let { model, session, evaluation, env, onSessionChange }: SliderComponentProps = $props();

// Reactive computed values
const isDisabled = $derived(env.mode === 'view' || env.mode === 'evaluate');
const _showRationale = $derived(
  env.mode === 'evaluate' && env.role === 'instructor' && model.rationaleEnabled && model.rationale
);
const _showEvaluation = $derived(env.mode === 'evaluate' && evaluation);

// Current value - just use what we have with a safe fallback
const currentValue = $derived(
  typeof session?.value === 'number' ? session.value : (model?.lowerBound ?? 0)
);
const _formattedValue = $derived(formatValue(currentValue, model));

// Step labels - show a reasonable number of labels (max ~10)
const _stepLabels = $derived(() => {
  if (!model.stepLabel || !model.step) return [];

  const labels: Array<{ value: number; position: number }> = [];
  const range = model.upperBound - model.lowerBound;

  // Calculate a reasonable label interval (aim for ~10 labels max)
  const targetLabels = 10;
  const labelStep = Math.max(model.step, Math.ceil(range / targetLabels / model.step) * model.step);

  for (let value = model.lowerBound; value <= model.upperBound; value += labelStep) {
    const position = ((value - model.lowerBound) / range) * 100;
    labels.push({ value, position });
  }

  return labels;
});

// Handle slider change
function _handleChange(event: Event) {
  if (isDisabled) return;

  const target = event.target as HTMLInputElement;
  const rawValue = parseFloat(target.value);
  const normalizedValue = normalizeValue(rawValue, model);

  onSessionChange({ value: normalizedValue });
}

// Evaluation status class
const _evaluationClass = $derived(() => {
  if (!evaluation) return '';
  if (evaluation.correct) return 'correct';
  if (evaluation.partialCredit && evaluation.partialCredit > 0) return 'partial';
  return 'incorrect';
});

// Unique IDs for accessibility
const _sliderId = $derived(`slider-${model.id}`);
const _promptId = $derived(`slider-prompt-${model.id}`);
const _statusId = $derived(`slider-status-${model.id}`);
</script>

<div
	class="pie-slider"
	class:horizontal={!model.orientation || model.orientation === 'horizontal'}
	class:vertical={model.orientation === 'vertical'}
	class:reverse={model.reverse}
	class:disabled={isDisabled}
	class:evaluated={_showEvaluation}
	class:correct={evaluation?.correct}
	class:incorrect={evaluation && !evaluation.correct}
>
	{#if model.promptEnabled && model.prompt}
		<div id={_promptId} class="prompt">
			{@html model.prompt}
		</div>
	{/if}

	<div class="slider-container">
		<div class="slider-wrapper">
			<!-- Min label -->
			<span class="bound-label min-label" aria-hidden="true">
				{formatValue(model.lowerBound, model)}
			</span>

			<!-- Slider input -->
			<div class="slider-track">
				<input
					type="range"
					id={_sliderId}
					class="slider-input {_evaluationClass()}"
					min={model.lowerBound}
					max={model.upperBound}
					step={model.step ?? 1}
					value={currentValue}
					disabled={isDisabled}
					aria-labelledby={model.promptEnabled && model.prompt ? _promptId : undefined}
					aria-label={!model.promptEnabled || !model.prompt ? 'Slider value selector' : undefined}
					aria-valuemin={model.lowerBound}
					aria-valuemax={model.upperBound}
					aria-valuenow={currentValue}
					aria-valuetext={_formattedValue}
					aria-describedby={_showEvaluation ? _statusId : undefined}
					aria-disabled={isDisabled}
					onchange={_handleChange}
					oninput={_handleChange}
				/>

				<!-- Step labels -->
				{#if model.stepLabel && _stepLabels().length > 0}
					<div class="step-labels" aria-hidden="true">
						{#each _stepLabels() as label}
							<span
								class="step-label"
								style="left: {label.position}%"
								data-value={label.value}
							>
								{formatValue(label.value, model)}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Max label -->
			<span class="bound-label max-label" aria-hidden="true">
				{formatValue(model.upperBound, model)}
			</span>
		</div>

		<!-- Current value display -->
		<div class="value-display" aria-live="polite" aria-atomic="true">
			<span class="value-label">Current value:</span>
			<span class="value-number">{_formattedValue}</span>
		</div>
	</div>

	<!-- Evaluation feedback -->
	{#if _showEvaluation && evaluation}
		<div id={_statusId} class="response-indicator {_evaluationClass()}" role="status" aria-live="polite">
			{#if evaluation.correct}
				<span class="status-icon">✓</span>
				<span class="status-text">Correct!</span>
			{:else if evaluation.partialCredit && evaluation.partialCredit > 0}
				<span class="status-icon">◐</span>
				<span class="status-text">
					Partially correct ({Math.round(evaluation.partialCredit * 100)}% credit)
				</span>
				{#if evaluation.difference !== undefined}
					<span class="difference">
						Off by {formatValue(evaluation.difference, model)}
					</span>
				{/if}
			{:else}
				<span class="status-icon">✗</span>
				<span class="status-text">Incorrect</span>
				{#if evaluation.difference !== undefined}
					<span class="difference">
						Off by {formatValue(evaluation.difference, model)}
					</span>
				{/if}
			{/if}

			{#if env.role === 'instructor' && model.correctResponse !== undefined}
				<div class="correct-answer">
					Correct answer: {formatValue(model.correctResponse, model)}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Rationale (instructor only) -->
	{#if _showRationale}
		<div class="rationale">
			<strong>Rationale:</strong>
			{@html model.rationale}
		</div>
	{/if}
</div>

<style>
	.pie-slider {
		font-family: system-ui, -apple-system, sans-serif;
		max-width: 600px;
		margin: 0 auto;
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

	.slider-track {
		flex: 1;
		position: relative;
		padding: 1rem 0;
		min-height: 24px; /* WCAG 2.2 Level AA minimum touch target */
		display: flex;
		align-items: center;
	}

	/* Native range input with accessibility */
	.slider-input {
		width: 100%;
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

	/* Step labels */
	.step-labels {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.5rem;
		pointer-events: none;
	}

	.step-label {
		position: absolute;
		transform: translateX(-50%);
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* Value display */
	.value-display {
		margin-top: 1rem;
		text-align: center;
		font-size: 1.125rem;
	}

	.value-label {
		color: #6b7280;
		margin-right: 0.5rem;
	}

	.value-number {
		font-weight: 600;
		color: #1f2937;
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

	/* Vertical orientation */
	.pie-slider.vertical .slider-wrapper {
		flex-direction: column;
		height: 300px;
	}

	.pie-slider.vertical .slider-track {
		height: 100%;
		width: auto;
		padding: 0 1rem;
	}

	.pie-slider.vertical .slider-input {
		width: 8px;
		height: 100%;
		writing-mode: bt-lr;
		-webkit-appearance: slider-vertical;
	}

	/* Reverse orientation */
	.pie-slider.reverse.horizontal .slider-input {
		direction: rtl;
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
