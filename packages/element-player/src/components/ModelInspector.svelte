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
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .spacer {
    flex: 1;
  }

  .dirty-badge {
    padding: 0.375rem 0.75rem;
    background: #fff8e1;
    color: #8a6d3b;
    border: 1px solid #f1c232;
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
    border: 1px solid #d1d5db;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s;
  }

  .btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #0066cc;
    color: white;
    border-color: #0066cc;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0052a3;
    border-color: #0052a3;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
    border-color: #6b7280;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
    border-color: #4b5563;
  }

  .error-banner {
    padding: 0.875rem 1rem;
    background: #ffebee;
    border: 1px solid #ef5350;
    border-radius: 0.5rem;
    color: #c62828;
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
