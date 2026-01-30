<script lang="ts">
/**
 * Source Route
 * Shows and allows editing of the raw model JSON
 */
import PlayerLayout from '$lib/element-player/components/PlayerLayout.svelte';
import SourceView from '$lib/element-player/components/SourceView.svelte';
import {
  elementName,
  model,
  session,
  mode,
  role,
  partialScoring,
  controller,
  capabilities,
  updateModel,
  sessionVersion
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

const debug = false;
let syncing = $state(false);

// Handle model changes from source view
function handleModelChanged(event: CustomEvent) {
  if (debug) console.log('[source] Model changed:', event.detail);
  syncing = true;
  updateModel(event.detail);
  // Increment session version to trigger rebuild in deliver tab
  sessionVersion.update(v => v + 1);
  setTimeout(() => {
    syncing = false;
  }, 300);
}
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
    {#if syncing}
      <div class="sync-indicator">
        <span class="spinner-small"></span>
        Synchronizing...
      </div>
    {/if}
    <SourceView
      bind:model={$model}
      {debug}
      on:model-changed={handleModelChanged}
    />
  {/snippet}
</PlayerLayout>

<style>
  .sync-indicator {
    position: fixed;
    top: 5rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    background: #4caf50;
    color: white;
    border-radius: 4px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 1000;
    animation: fadeIn 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .spinner-small {
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
