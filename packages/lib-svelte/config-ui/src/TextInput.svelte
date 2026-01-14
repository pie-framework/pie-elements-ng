<script lang="ts">
/**
 * Text input component for configuration forms
 */
interface Props {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  help?: string;
  onchange?: (value: string) => void;
}

let {
  label,
  value = $bindable(''),
  placeholder,
  required = false,
  disabled = false,
  help,
  onchange,
}: Props = $props();

function _handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  value = target.value;
  onchange?.(value);
}
</script>

<div class="pie-text-input">
  <label>
    {label}
    {#if required}<span class="required">*</span>{/if}
  </label>
  <input
    type="text"
    {value}
    {placeholder}
    {required}
    {disabled}
    oninput={handleInput}
    class="input input-bordered w-full"
  />
  {#if help}
    <div class="help-text">{help}</div>
  {/if}
</div>

<style>
  .pie-text-input {
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
