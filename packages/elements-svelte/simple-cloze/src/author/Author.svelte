<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
import { EditableHtml } from '@pie-lib/editable-html-tiptap-svelte';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

let { model = $bindable(), onChange }: { model?: any; onChange?: (model: any) => void } = $props();

function emitModelUpdate(nextModel: any) {
  // Match the expected contract used by AuthorView:
  // detail contains { update, reset }
  dispatch('model.updated', { update: nextModel, reset: false });
}

function handlePromptChange(html: string) {
  if (onChange && model) {
    onChange({ ...model, prompt: html });
  }
  if (model) {
    emitModelUpdate({ ...model, prompt: html });
  }
}

function handleAnswerChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (onChange && model) {
    onChange({ ...model, correctAnswer: target.value });
  }
  if (model) {
    emitModelUpdate({ ...model, correctAnswer: target.value });
  }
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
    <label for="simple-cloze-correct-answer" class="block text-sm text-gray-600 mb-2">
      Correct Answer
    </label>
    <input
      id="simple-cloze-correct-answer"
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

