<script lang="ts">
import type { MathFieldProps } from './types.js';

let { latex = '', disabled = false, onChange = () => {} }: MathFieldProps = $props();

function handleInput(event: Event) {
  onChange((event.currentTarget as HTMLInputElement).value);
}
</script>

<input type="text" value={latex} oninput={handleInput} {disabled} />
