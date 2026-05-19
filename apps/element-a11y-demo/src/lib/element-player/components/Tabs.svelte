<script lang="ts">
/**
 * Tabs Component
 * Tab navigation for switching between Delivery and Configure views
 */

import type { Tab } from '../lib/types';

let {
  tabs = [],
  active = $bindable('delivery'),
}: {
  tabs: Tab[];
  active?: string;
} = $props();
</script>

<div role="tablist" class="tabs tabs-bordered mb-4">
  {#each tabs as tab}
    <button
      role="tab"
      class="tab"
      class:tab-active={active === tab.id}
      class:tab-disabled={tab.disabled}
      disabled={tab.disabled}
      onclick={() => !tab.disabled && (active = tab.id)}
      title={tab.description}
      data-testid="tab-{tab.id}"
    >
      <div class="flex flex-col items-center gap-1">
        <span class="font-medium">{tab.label}</span>
        {#if tab.description}
          <span class="text-xs opacity-70 max-sm:hidden">{tab.description}</span>
        {/if}
      </div>
    </button>
  {/each}
</div>
