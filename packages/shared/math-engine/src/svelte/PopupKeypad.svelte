<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { nextPopupState, type PopupState } from '../popup-state';

const dispatch = createEventDispatcher<{
  close: undefined;
  key: { value: string };
  intent: { type: 'matrix:add-row' | 'matrix:add-column' };
}>();

export let open = false;
export let keys: string[] = [];

let state: PopupState = 'closed';
let root: HTMLDivElement | null = null;

$effect(() => {
  state = nextPopupState(state, { type: open ? 'OPEN' : 'CLOSE' });
  state = nextPopupState(state, { type: open ? 'OPENED' : 'CLOSED' });
});

function onKeyDown(event: KeyboardEvent): void {
  if (event.shiftKey && event.key === 'Enter') {
    dispatch('intent', { type: 'matrix:add-row' });
    return;
  }

  if (event.shiftKey && event.key === ' ') {
    event.preventDefault();
    dispatch('intent', { type: 'matrix:add-column' });
    return;
  }

  if (event.key === 'Escape') {
    dispatch('close');
    return;
  }

  if (event.key === 'Tab') {
    state = nextPopupState(state, { type: 'TRAP_FOCUS' });
  }
}

function onBlur(): void {
  state = nextPopupState(state, { type: 'RELEASE_FOCUS' });
}

function onSelect(value: string): void {
  dispatch('key', { value });
}
</script>

{#if state !== 'closed'}
  <div
    bind:this={root}
    class="pie-math-engine-keypad"
    data-keypad="true"
    role="dialog"
    tabindex="-1"
    on:keydown={onKeyDown}
    on:blur={onBlur}
  >
    {#each keys as value}
      <button type="button" on:click={() => onSelect(value)}>{value}</button>
    {/each}
  </div>
{/if}

<style>
  .pie-math-engine-keypad {
    display: grid;
    grid-template-columns: repeat(5, minmax(40px, 1fr));
    gap: 4px;
    padding: 8px;
    background: #eef1ff;
    border: 1px solid #cfd8ff;
  }
</style>
