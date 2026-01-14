<script lang="ts">
import type { Choice, MultipleChoiceModel } from '../types';

interface Props {
  model: MultipleChoiceModel;
  onModelChange: (model: MultipleChoiceModel) => void;
}

const { model, onModelChange }: Props = $props();

function _updatePrompt(html: string) {
  onModelChange({ ...model, prompt: html });
}

function _updateChoice(index: number, updates: Partial<Choice>) {
  const choices = [...model.choices];
  choices[index] = { ...choices[index], ...updates };
  onModelChange({ ...model, choices });
}

function _addChoice() {
  const newChoice: Choice = {
    value: `choice-${Date.now()}`,
    label: '',
    correct: false,
  };
  onModelChange({ ...model, choices: [...model.choices, newChoice] });
}

function _removeChoice(index: number) {
  if (model.choices.length <= 2) {
    alert('You must have at least 2 choices');
    return;
  }
  const choices = model.choices.filter((_, i) => i !== index);
  onModelChange({ ...model, choices });
}

function _toggleCorrect(index: number) {
  const choices = [...model.choices];

  if (model.choiceMode === 'radio') {
    // Radio mode: only one can be correct
    choices.forEach((choice, i) => {
      choice.correct = i === index;
    });
  } else {
    // Checkbox mode: toggle this choice
    choices[index].correct = !choices[index].correct;
  }

  onModelChange({ ...model, choices });
}

function _updateChoiceMode(mode: 'radio' | 'checkbox') {
  onModelChange({ ...model, choiceMode: mode });
}

function _togglePartialScoring() {
  onModelChange({ ...model, partialScoring: !model.partialScoring });
}
</script>

<div class="configure-container p-4 space-y-6">
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Configure Multiple Choice</h2>

			<!-- Prompt Section -->
			<div class="form-control">
				<h3 class="text-sm font-semibold mb-2">Prompt</h3>
				<RichTextEditor value={model.prompt} onChange={updatePrompt} minHeight={100} />
			</div>

			<!-- Choices Section -->
			<div class="form-control">
				<h3 class="text-sm font-semibold mb-2">Choices</h3>

				<div class="space-y-3">
					{#each model.choices as choice, index}
						<div class="border border-base-300 rounded-lg p-3">
							<div class="flex items-start gap-2">
								<!-- Choice Letter/Number -->
								<div class="badge badge-primary mt-2">
									{model.choicePrefix === 'letters'
										? String.fromCharCode(65 + index)
										: index + 1}
								</div>

								<!-- Choice Content -->
								<div class="flex-1">
									<RichTextEditor
										value={choice.label}
										onChange={(html) => updateChoice(index, { label: html })}
										minHeight={60}
										placeholder="Enter choice text..."
									/>
								</div>

								<!-- Correct Checkbox -->
								<div class="form-control">
									<label class="label cursor-pointer gap-2">
										<span class="label-text text-xs">Correct</span>
										<input
											type="checkbox"
											class="checkbox checkbox-success checkbox-sm"
											checked={choice.correct}
											onchange={() => toggleCorrect(index)}
										/>
									</label>
								</div>

								<!-- Delete Button -->
								<button
									type="button"
									class="btn btn-error btn-sm btn-square"
									onclick={() => removeChoice(index)}
									disabled={model.choices.length <= 2}
									title="Remove choice"
								>
									×
								</button>
							</div>
						</div>
					{/each}
				</div>

				<button type="button" class="btn btn-primary btn-sm mt-3" onclick={addChoice}>
					+ Add Choice
				</button>
			</div>

			<!-- Settings Section -->
			<div class="divider">Settings</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Choice Mode -->
				<div class="form-control">
					<h3 class="text-sm font-semibold mb-2">Response Type</h3>
					<div class="join">
						<input
							class="join-item btn btn-sm"
							type="radio"
							name="choiceMode"
							aria-label="Radio"
							checked={model.choiceMode === 'radio'}
							onchange={() => updateChoiceMode('radio')}
						/>
						<input
							class="join-item btn btn-sm"
							type="radio"
							name="choiceMode"
							aria-label="Checkbox"
							checked={model.choiceMode === 'checkbox'}
							onchange={() => updateChoiceMode('checkbox')}
						/>
					</div>
				</div>

				<!-- Partial Scoring -->
				{#if model.choiceMode === 'checkbox'}
					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text">Partial Scoring</span>
							<input
								type="checkbox"
								class="toggle toggle-primary"
								checked={model.partialScoring}
								onchange={togglePartialScoring}
							/>
						</label>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.configure-container {
		max-width: 1200px;
		margin: 0 auto;
	}
</style>
