<script lang="ts">
/**
 * Print Route
 * Shows the print-friendly version of the element
 */
import PlayerLayout from '$lib/element-player/components/PlayerLayout.svelte';
import PrintView from '$lib/element-player/components/PrintView.svelte';
import {
  elementName,
  model,
  session,
  mode,
  role,
  partialScoring,
  controller,
  capabilities
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

const debug = false;
</script>

<PlayerLayout
  elementName={$elementName}
  model={$model}
  session={$session}
  bind:mode={$mode}
  bind:playerRole={$role}
  bind:partialScoring={$partialScoring}
  bind:controller={$controller}
  capabilities={$capabilities}
  {debug}
>
  {#snippet children()}
    <PrintView
      elementName={$elementName}
      model={$model}
      role={$role}
      {debug}
    />
  {/snippet}
</PlayerLayout>
