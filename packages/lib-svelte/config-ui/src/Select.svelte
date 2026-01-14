<script lang="ts">
/**
 * Select dropdown component for configuration forms
 */
interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  help?: string;
  onchange?: (value: string) => void;
}

let {
  label,
  value = $bindable(''),
  options,
  required = false,
  disabled = false,
  help,
  onchange,
}: Props = $props();

function _handleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  value = target.value;
  onchange?.(value);
}
</script>

<div class="pie-select">
  <label>
    {label}
    {#if required}<span class="required">*</span>{/if}
  </label>
  <select
    {value}
    {required}
    {disabled}
    onchange={handleChange}
    class="select select-bordered w-full"
  >
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  {#if help}
    <div class="help-text">{help}</div>
  {/if}
</div>

<style>
  .pie-select {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  label {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .required {
    color: #dc2626;
    margin-left: 0.25rem;
  }

  .help-text {
    font-size: 0.75rem;
    color: #6b7280;
  }
</style>
