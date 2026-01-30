<script lang="ts">
/**
 * Source View - Shows and allows editing of the raw model JSON
 */
import ModelInspector from './ModelInspector.svelte';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

// Props
let {
  model = $bindable({}),
  debug = false,
}: {
  model?: any;
  debug?: boolean;
} = $props();

function handleModelApply(nextModel: any) {
  if (debug) console.log('[source-view] Model apply:', nextModel);
  model = { ...(nextModel ?? {}) };
  dispatch('model-changed', model);
}
</script>

<div class="source-view">
  <ModelInspector bind:model onModelChange={handleModelApply} />
</div>

<style>
  .source-view {
    height: 100%;
    overflow: auto;
  }
</style>
