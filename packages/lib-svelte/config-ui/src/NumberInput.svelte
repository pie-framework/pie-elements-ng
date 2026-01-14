<script lang="ts">
/**
 * Number input component for configuration forms
 */
interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
  help?: string;
  onchange?: (value: number) => void;
}

let {
  label,
  value = $bindable(0),
  min,
  max,
  step = 1,
  required = false,
  disabled = false,
  help,
  onchange,
}: Props = $props();

function _handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  value = target.valueAsNumber;
  onchange?.(value);
}
</script>

<div class="pie-number-input">
  <label>
    {label}
    {#if required}<span class="required">*</span>{/if}
  </label>
  <input
    type="number"
    {value}
    {min}
    {max}
    {step}
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
  .pie-number-input {
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
