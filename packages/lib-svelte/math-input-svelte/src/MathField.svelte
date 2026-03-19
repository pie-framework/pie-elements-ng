<script lang="ts">
export let latex = '';
export let disabled = false;
export let onChange: ((value: string) => void) | undefined;

const handleInput = (event: Event) => {
  const value = (event.currentTarget as HTMLInputElement).value;
  onChange?.(value);
};
</script>

<input type="text" value={latex} on:input={handleInput} {disabled} />
