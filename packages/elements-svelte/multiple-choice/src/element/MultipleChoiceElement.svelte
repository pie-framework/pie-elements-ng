<svelte:options customElement="pie-multiple-choice" />

<script lang="ts">
/**
 * PIE Multiple Choice Custom Element
 *
 * This is the web component wrapper that makes the Svelte component
 * work as a custom element for PIE players.
 */

import { model as modelController } from '../controller/index';
import type { MultipleChoiceModel, MultipleChoiceSession } from '../types';

// Props that become element properties/attributes
let modelProp = $state<MultipleChoiceModel | null>(null);
let sessionProp = $state<MultipleChoiceSession | null>(null);

// Internal view model
let _viewModel = $state<any>(null);

// Process model through controller when it changes
$effect(() => {
  if (modelProp) {
    // Call controller to get view model
    const env = { mode: 'gather' as const, role: 'student' as const };
    modelController(modelProp, sessionProp || {}, env).then((vm) => {
      _viewModel = vm;
    });
  }
});

function _handleChange(value: string[]) {
  if (!sessionProp) {
    sessionProp = { value: [] };
  }
  sessionProp.value = value;

  // Dispatch session-changed event for PIE player
  const event = new CustomEvent('session-changed', {
    detail: { session: sessionProp },
    bubbles: true,
    composed: true,
  });
  dispatchEvent(event);
}

// Expose properties for PIE player to set
export { modelProp as model, sessionProp as session };
</script>

{#if viewModel}
  <MultipleChoice
    model={viewModel}
    session={sessionProp || { value: [] }}
    onChange={handleChange}
  />
{/if}
