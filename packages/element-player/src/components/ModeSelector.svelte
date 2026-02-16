<script lang="ts">
/**
 * Mode Selector Component
 * Allows switching between gather/view/evaluate modes
 */

let {
  mode = $bindable('gather'),
  evaluateDisabled = false,
}: {
  mode?: 'gather' | 'view' | 'evaluate';
  evaluateDisabled?: boolean;
} = $props();
</script>

<div class="mode-selector">
  <label class:active={mode === 'gather'}>
    <input type="radio" bind:group={mode} value="gather" />
    <span>Gather</span>
  </label>

  <label class:active={mode === 'view'}>
    <input type="radio" bind:group={mode} value="view" />
    <span>View</span>
  </label>

  <label class:active={mode === 'evaluate'} class:disabled={evaluateDisabled}>
    <input type="radio" bind:group={mode} value="evaluate" disabled={evaluateDisabled} />
    <span>Evaluate</span>
  </label>
</div>

<style>
  .mode-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  label:hover {
    background: #f5f5f5;
  }

  label.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  label.disabled:hover {
    background: transparent;
  }

  label.active {
    background: #e3f2fd;
    border-color: #0066cc;
  }

  input[type="radio"] {
    cursor: pointer;
  }

  span {
    font-weight: 500;
    user-select: none;
  }
</style>
