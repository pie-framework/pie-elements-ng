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

<div class="card bg-base-100 border border-base-300">
  <div class="card-body p-4">
    <h3 class="card-title text-sm uppercase text-base-content/60 mb-2">Model</h3>
    <textarea
      class="textarea textarea-bordered font-mono text-sm w-full"
      value={text}
      rows="10"
      oninput={handleInput}
    ></textarea>
    {#if error}
      <div class="text-error text-sm mt-2">{error}</div>
    {/if}
    <div class="flex gap-2 mt-3">
      <button class="btn btn-primary btn-sm" onclick={apply} disabled={!dirty}>Apply</button>
      <button class="btn btn-sm" onclick={reset} disabled={!dirty}>Reset</button>
    </div>
  </div>
</div>
