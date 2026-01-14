<script lang="ts">
import type { MultipleChoiceViewModel } from '../types';
import Prompt from '@pie-elements-ng/lib-ui/Prompt.svelte';
import Feedback from '@pie-elements-ng/lib-ui/Feedback.svelte';
import Rationale from '@pie-elements-ng/lib-ui/Rationale.svelte';

interface Props {
  model: MultipleChoiceViewModel;
  session: { value?: string[] };
  onChange: (value: string[]) => void;
}

const { model, session, onChange }: Props = $props();

function _handleChoiceChange(choiceValue: string) {
  if (model.disabled) return;

  let newValue: string[];

  if (model.choiceMode === 'radio') {
    newValue = [choiceValue];
  } else {
    const current = session.value ?? [];
    if (current.includes(choiceValue)) {
      newValue = current.filter((v) => v !== choiceValue);
    } else {
      newValue = [...current, choiceValue];
    }
  }

  onChange(newValue);
}

function _getChoicePrefix(index: number): string {
  if (model.choicePrefix === 'letters') {
    return String.fromCharCode(65 + index); // A, B, C, ...
  }
  if (model.choicePrefix === 'numbers') {
    return String(index + 1); // 1, 2, 3, ...
  }
  return '';
}

function _isChecked(choiceValue: string): boolean {
  return session.value?.includes(choiceValue) ?? false;
}

function _isCorrectChoice(choiceValue: string): boolean {
  return model.correctResponse?.includes(choiceValue) ?? false;
}
</script>

<div class="pie-multiple-choice" role="group" aria-labelledby={model.promptEnabled ? 'mc-prompt' : undefined}>
	{#if model.prompt && model.promptEnabled}
		<div id="mc-prompt" class="prompt mb-4">
			<Prompt html={model.prompt} />
		</div>
	{/if}

	<div
		class="choices"
		class:vertical={model.choicesLayout === 'vertical'}
		class:horizontal={model.choicesLayout === 'horizontal'}
		class:grid={model.choicesLayout === 'grid'}
	>
		{#each model.choices as choice, index}
			{@const prefix = _getChoicePrefix(index)}
			{@const checked = _isChecked(choice.value)}
			{@const inputType = model.choiceMode === 'radio' ? 'radio' : 'checkbox'}
			{@const isCorrect = _isCorrectChoice(choice.value)}

			<label class="choice" class:disabled={model.disabled} class:correct={model.mode === 'evaluate' && isCorrect}>
				<div class="choice-input-wrapper">
					<input
						type={inputType}
						name="multiple-choice"
						value={choice.value}
						{checked}
						disabled={model.disabled}
						onchange={() => _handleChoiceChange(choice.value)}
						aria-describedby={choice.showFeedback ? `feedback-${choice.value}` : undefined}
					/>

					{#if prefix}
						<span class="choice-prefix">{prefix}.</span>
					{/if}
				</div>

				<div class="choice-content">
					<div class="choice-label">
						<Prompt html={choice.label} />
					</div>

					{#if choice.showFeedback && choice.feedback}
						<div id="feedback-${choice.value}" class="feedback mt-2">
							<Feedback correct={choice.correct && checked} feedback={choice.feedback} />
						</div>
					{/if}
				</div>
			</label>
		{/each}
	</div>

	{#if model.responseCorrect !== undefined}
		<div class="response-indicator mt-4" role="status" aria-live="polite">
			{#if model.responseCorrect}
				<Feedback correct={true} feedback="Correct!" />
			{:else}
				<Feedback correct={false} feedback="Incorrect. Please review your answer." />
			{/if}
		</div>
	{/if}

	{#if model.showRationale && model.rationale}
		<div class="rationale mt-4">
			<Rationale rationale={model.rationale} />
		</div>
	{/if}
</div>

<style>
	.pie-multiple-choice {
		font-family: system-ui, -apple-system, sans-serif;
		line-height: 1.5;
	}

	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.choices.vertical {
		flex-direction: column;
	}

	.choices.horizontal {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.choices.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 0.75rem;
	}

	.choice {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		border: 2px solid hsl(var(--bc) / 0.2);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		background-color: hsl(var(--b1));
	}

	.choice:hover:not(.disabled) {
		background-color: hsl(var(--b2));
		border-color: hsl(var(--bc) / 0.3);
	}

	.choice:focus-within {
		outline: 2px solid hsl(var(--p));
		outline-offset: 2px;
	}

	.choice.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.choice.correct {
		border-color: hsl(var(--su) / 0.5);
		background-color: hsl(var(--su) / 0.1);
	}

	.choice-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.choice input {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
		accent-color: hsl(var(--p));
	}

	.choice.disabled input {
		cursor: not-allowed;
	}

	.choice-prefix {
		font-weight: 600;
		color: hsl(var(--bc) / 0.7);
		min-width: 1.5rem;
	}

	.choice-content {
		flex: 1;
		min-width: 0;
	}

	.choice-label {
		color: hsl(var(--bc));
	}

	.feedback {
		margin-top: 0.5rem;
	}

	.response-indicator {
		padding: 1rem;
		border-radius: 0.5rem;
		background-color: hsl(var(--b2));
	}

	.rationale {
		margin-top: 1rem;
	}
</style>
