<script lang="ts">
/**
 * Author Route
 * Shows the configure component for authoring questions
 */
import PlayerLayout from '$lib/element-player/components/PlayerLayout.svelte';
import AuthorView from '$lib/element-player/components/AuthorView.svelte';
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
  sessionVersion,
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

const debug = false;
let syncing = $state(false);

// Handle model changes from configure component
function handleModelChanged(event: CustomEvent) {
  console.log('[author] Model changed event received:', event.detail);
  syncing = true;
  updateModel(event.detail);
  console.log('[author] updateModel() called, model store should be updated');
  setTimeout(() => {
    syncing = false;
  }, 300);
}
</script>

<PlayerLayout
  elementName={data.elementName}
  packageName={data.packageName}
  bind:controller={$controller}
  capabilities={data.capabilities}
  {debug}
>
  {#snippet children()}
    {#if syncing}
      <div class="sync-indicator">
        <span class="spinner-small"></span>
        Synchronizing...
      </div>
    {/if}
    <AuthorView
      elementName={$elementName}
      model={$model}
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
