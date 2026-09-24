<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';
import { EditableHtml } from '@pie-lib/editable-html-tiptap-svelte';

let { model = $bindable() }: { model?: any } = $props();

const answerInputId = `simple-cloze-correct-answer-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Keeps the edit as the element's model, so the next edit builds on it, and
 * announces it as a bubbling `model.updated` for the player listening at its
 * root. The update spreads the whole model, so fields this form does not edit
 * survive.
 */
function emitModelUpdate(patch: Record<string, unknown>) {
  const nextModel = { ...(model || {}), ...patch };
  model = nextModel;
  $host().dispatchEvent(new ModelUpdatedEvent(nextModel));
}

function handlePromptChange(html: string) {
  emitModelUpdate({ prompt: html });
}

function handleAnswerChange(e: Event) {
  emitModelUpdate({ correctAnswer: (e.target as HTMLInputElement).value });
}
</script>

<div class="simple-cloze-author">
  <div class="input-container">
    <span class="input-label">Prompt</span>
    <EditableHtml
      markup={model?.prompt || ""}
      onChange={handlePromptChange}
      placeholder="Enter your question here..."
    />
  </div>

  <div class="mb-6">
    <label for={answerInputId} class="block text-sm text-gray-600 mb-2">
      Correct Answer
    </label>
    <input
      id={answerInputId}
      type="text"
      class="input input-bordered w-full"
      placeholder="Enter the correct answer"
      value={model?.correctAnswer || ""}
      oninput={handleAnswerChange}
    />
  </div>
</div>

<style>
  .simple-cloze-author {
    max-width: 56rem;
    margin: 0 auto;
    padding: 24px;
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

  :global(.simple-cloze-author .editor-container) {
    border-color: var(--pie-border-light, #ccc);
    border-radius: 4px;
  }

  :global(.simple-cloze-author .editor-holder) {
    min-height: 140px;
  }
</style>

