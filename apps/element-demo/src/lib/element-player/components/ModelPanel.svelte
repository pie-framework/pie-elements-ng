<script lang="ts">
/**
 * Model Panel Component
 * Displays and optionally edits the current model as JSON.
 */

type ApplyHandler = (nextModel: any) => void;

let { model = {}, onApply }: { model?: any; onApply?: ApplyHandler } = $props();

let text = $state('');
let error = $state<string | null>(null);
let dirty = $state(false);

$effect(() => {
  if (!dirty) {
    text = JSON.stringify(model ?? {}, null, 2);
  }
});

const handleInput = (event: Event) => {
  text = (event.target as HTMLTextAreaElement).value;
  dirty = true;
};

const apply = () => {
  try {
    const parsed = JSON.parse(text);
    onApply?.(parsed);
    error = null;
    dirty = false;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Invalid JSON';
  }
};

const reset = () => {
  text = JSON.stringify(model ?? {}, null, 2);
  error = null;
  dirty = false;
};
</script>

<div class="model-panel panel">
  <h3>Model</h3>
  <textarea value={text} rows="10" oninput={handleInput}></textarea>
  {#if error}
    <div class="error-text">{error}</div>
  {/if}
  <div class="actions">
    <button class="btn" onclick={apply} disabled={!dirty}>Apply</button>
    <button class="btn secondary" onclick={reset} disabled={!dirty}>Reset</button>
  </div>
</div>

<style>
  textarea {
    width: 100%;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 0.85rem;
    line-height: 1.4;
    resize: vertical;
  }

  .error-text {
    margin-top: 0.5rem;
    color: #c62828;
    font-size: 0.85rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .btn {
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.secondary {
    background: #f6f6f6;
  }
</style>
