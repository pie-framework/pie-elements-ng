<script lang="ts">
/**
 * Model Inspector Component
 * Full-width JSON editor with toolbar for model editing
 */

import JsonEditor from './JsonEditor.svelte';

let {
  model = $bindable({}),
  onModelChange,
}: {
  model?: any;
  onModelChange?: (nextModel: any) => void;
} = $props();

let jsonText = $state('');
let error = $state<string | null>(null);
let dirty = $state(false);
let isInitializing = $state(true);

// Initialize jsonText with model and sync when model changes externally
$effect(() => {
  const newJson = JSON.stringify(model ?? {}, null, 2);
  if (!dirty || isInitializing) {
    jsonText = newJson;
    if (isInitializing) {
      isInitializing = false;
    }
  }
});

const handleInput = (text: string) => {
  // Only mark as dirty if user actually changed the content
  const currentModelJson = JSON.stringify(model ?? {}, null, 2);
  if (text !== currentModelJson && !isInitializing) {
    jsonText = text;
    dirty = true;
  } else if (!isInitializing) {
    jsonText = text;
  }
};

const apply = () => {
  try {
    const parsed = JSON.parse(jsonText);
    onModelChange?.(parsed);
    error = null;
    dirty = false;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Invalid JSON';
  }
};

const format = () => {
  try {
    const parsed = JSON.parse(jsonText);
    jsonText = JSON.stringify(parsed, null, 2);
    error = null;
  } catch (err) {
    error = 'Cannot format: ' + (err instanceof Error ? err.message : 'Invalid JSON');
  }
};

const reset = () => {
  jsonText = JSON.stringify(model ?? {}, null, 2);
  error = null;
  dirty = false;
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(jsonText);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
};
</script>

<div class="model-inspector">
  <div class="toolbar">
    <button class="btn btn-sm" onclick={format} title="Format JSON">
      <span>📐</span>
      <span class="label">Format</span>
    </button>
    <button class="btn btn-sm" onclick={copyToClipboard} title="Copy to clipboard">
      <span>📋</span>
      <span class="label">Copy</span>
    </button>
    <div class="spacer"></div>
    {#if dirty}
      <span class="dirty-badge">Unsaved changes</span>
    {/if}
    <button class="btn btn-sm btn-secondary" onclick={reset} disabled={!dirty} title="Reset changes">
      <span>↺</span>
      <span class="label">Reset</span>
    </button>
    <button class="btn btn-sm btn-primary" onclick={apply} disabled={!dirty} title="Apply changes">
      <span>✓</span>
      <span class="label">Apply</span>
    </button>
  </div>

  <JsonEditor bind:value={jsonText} onInput={handleInput} minHeight={600} />

  {#if error}
    <div class="error-banner">
      <span>⚠️</span>
      <span>{error}</span>
    </div>
  {/if}
</div>

<style>
  .model-inspector {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 1rem;
  }

  .toolbar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.75rem;
    background: hsl(var(--b2));
    border: 1px solid hsl(var(--bc) / 0.2);
    border-radius: 0.5rem;
  }

  .spacer {
    flex: 1;
  }

  .dirty-badge {
    padding: 0.375rem 0.75rem;
    background: hsl(var(--wa) / 0.1);
    color: hsl(var(--wa));
    border: 1px solid hsl(var(--wa) / 0.5);
    border-radius: 0.25rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    border-radius: 0.375rem;
    border: 1px solid hsl(var(--bc) / 0.2);
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s;
  }

  .btn:hover:not(:disabled) {
    background: hsl(var(--b2));
    border-color: hsl(var(--bc) / 0.3);
  }

  .btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: hsl(var(--p));
    color: white;
    border-color: hsl(var(--p));
  }

  .btn-primary:hover:not(:disabled) {
    background: hsl(var(--p));
    border-color: hsl(var(--p));
  }

  .btn-secondary {
    background: hsl(var(--bc) / 0.4);
    color: white;
    border-color: hsl(var(--bc) / 0.4);
  }

  .btn-secondary:hover:not(:disabled) {
    background: hsl(var(--bc) / 0.5);
    border-color: hsl(var(--bc) / 0.5);
  }

  .error-banner {
    padding: 0.875rem 1rem;
    background: hsl(var(--er) / 0.1);
    border: 1px solid hsl(var(--er));
    border-radius: 0.5rem;
    color: hsl(var(--er));
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .btn .label {
      display: none;
    }

    .btn {
      padding: 0.5rem;
    }
  }
</style>
