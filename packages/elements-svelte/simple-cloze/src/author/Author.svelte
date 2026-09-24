<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      configuration: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';
import {
  ConfigLayout,
  SettingsPanel,
  hasSettings,
  mergeConfiguration,
  toggle,
} from '@pie-lib/config-ui-svelte';
import { EditableHtml } from '@pie-lib/editable-html-tiptap-svelte';
import { createDefaultModel } from '../controller/index';
import defaults from '../controller/defaults';

let {
  model = $bindable(),
  configuration,
}: { model?: any; configuration?: Record<string, unknown> } = $props();

const answerInputId = `simple-cloze-correct-answer-${Math.random().toString(36).slice(2, 10)}`;

/** The model with the controller's defaults filled in, which delivery renders too. */
const m = $derived(createDefaultModel(model || undefined));
const config = $derived(mergeConfiguration(defaults.configuration, configuration));

/**
 * Keeps the edit as the element's model, so the next edit builds on it, and
 * announces it as a bubbling `model.updated` for the player listening at its
 * root. The update spreads the whole model, so fields this form does not edit
 * survive.
 */
function emitModelUpdate(patch: Record<string, unknown>) {
  const nextModel = { ...m, ...patch };
  model = nextModel;
  $host().dispatchEvent(new ModelUpdatedEvent(nextModel));
}

function handleAnswerChange(e: Event) {
  emitModelUpdate({ correctAnswer: (e.target as HTMLInputElement).value });
}
</script>

<div class="simple-cloze-author">
  <ConfigLayout hideSettings={config.settingsPanelDisabled === true || !hasSettings(config)}>
    {#snippet settings()}
      <SettingsPanel
        model={m}
        configuration={config}
        groups={{
          Settings: {
            promptEnabled: config.prompt?.settings && toggle(config.prompt.label),
          },
          Properties: {
            teacherInstructionsEnabled:
              config.teacherInstructions?.settings && toggle(config.teacherInstructions.label),
          },
        }}
        onChangeModel={(next) => emitModelUpdate(next)}
      />
    {/snippet}

    <div class="design-fields">
      {#if m.teacherInstructionsEnabled}
        <div class="input-container">
          <span class="input-label">{config.teacherInstructions?.label}</span>
          <EditableHtml
            markup={m.teacherInstructions || ''}
            onChange={(html) => emitModelUpdate({ teacherInstructions: html })}
            ariaLabel={config.teacherInstructions?.label}
          />
        </div>
      {/if}

      {#if m.promptEnabled}
        <div class="input-container">
          <span class="input-label">{config.prompt?.label}</span>
          <EditableHtml
            markup={m.prompt || ''}
            onChange={(html) => emitModelUpdate({ prompt: html })}
            placeholder="Enter your question here..."
            ariaLabel={config.prompt?.label}
          />
        </div>
      {/if}

      <div class="answer-container">
        <label for={answerInputId} class="answer-label">
          Correct Answer
        </label>
        <input
          id={answerInputId}
          type="text"
          class="answer-input"
          placeholder="Enter the correct answer"
          value={m.correctAnswer || ''}
          oninput={handleAnswerChange}
        />
      </div>
    </div>
  </ConfigLayout>
</div>

<style>
  .simple-cloze-author {
    padding: 24px;
  }

  .design-fields {
    max-width: 56rem;
  }

  .input-container {
    position: relative;
    padding-top: 16px;
    margin-bottom: 24px;
    width: 100%;
  }

  .input-label {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    transform: scale(0.75) translate(0, -0.75em);
    color: var(--pie-text, rgba(0, 0, 0, 0.6));
    pointer-events: none;
  }

  .answer-container {
    margin-bottom: 24px;
  }

  .answer-label {
    display: block;
    margin-bottom: 8px;
    font-size: 0.875rem;
    color: var(--pie-text, rgba(0, 0, 0, 0.6));
  }

  .answer-input {
    box-sizing: border-box;
    width: 100%;
    height: 2.5rem;
    padding: 0 12px;
    border: 1px solid var(--pie-border-light, #ccc);
    border-radius: 4px;
    font: inherit;
  }

  :global(.simple-cloze-author .editor-container) {
    border-color: var(--pie-border-light, #ccc);
    border-radius: 4px;
  }

  :global(.simple-cloze-author .editor-holder) {
    min-height: 140px;
  }
</style>
