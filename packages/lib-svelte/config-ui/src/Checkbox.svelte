<script lang="ts">
/**
 * Checkbox component for configuration forms
 */
interface Props {
  label: string;
  checked: boolean;
  disabled?: boolean;
  help?: string;
  onchange?: (checked: boolean) => void;
}

let { label, checked = $bindable(false), disabled = false, help, onchange }: Props = $props();

function _handleChange(e: Event) {
  const target = e.target as HTMLInputElement;
  checked = target.checked;
  onchange?.(checked);
}
</script>

<div class="pie-checkbox">
  <label class="checkbox-label">
    <input
      type="checkbox"
      {checked}
      {disabled}
      onchange={handleChange}
      class="checkbox"
    />
    <span>{label}</span>
  </label>
  {#if help}
    <div class="help-text">{help}</div>
  {/if}
</div>

<style>
  .pie-checkbox {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .checkbox-label:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .help-text {
    font-size: 0.75rem;
    color: #6b7280;
    margin-left: 2rem;
  }
</style>
