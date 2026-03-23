<script lang="ts">
/**
 * Author Route
 * Shows the configure component for authoring questions
 */
import PlayerLayout from '$lib/element-player/components/PlayerLayout.svelte';
import { page } from '$app/stores';
import { parsePlayerType, type PlayerType } from '$lib/config/player-runtime';
import '@pie-element/element-player/players';
import {
  model,
  controller,
  updateModel,
  iifeBuildMeta,
  iifeBuildLoading,
  iifeBuildRequestVersion,
  theme,
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

const debug = false;
let syncing = $state(false);
const playerType = $derived<PlayerType>(parsePlayerType($page.url.searchParams.get('player')));

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

function handleBundleMeta(event: CustomEvent) {
  iifeBuildMeta.set({ ...(event.detail || {}), stage: 'completed', error: null });
}

function handleBuildState(event: CustomEvent) {
  const detail = (event.detail || {}) as {
    loading?: boolean;
    error?: string | null;
    stage?: string;
  };
  iifeBuildLoading.set(!!detail.loading);
  if (detail.stage) {
    iifeBuildMeta.update((prev) => ({
      source: prev?.source ?? 'local',
      url: prev?.url ?? '',
      hash: prev?.hash,
      duration: prev?.duration,
      cached: prev?.cached,
      stage: detail.stage,
      error: prev?.error ?? null,
    }));
  }
  if (detail.error) {
    iifeBuildMeta.update((prev) => ({
      source: prev?.source ?? 'local',
      url: prev?.url ?? '',
      hash: prev?.hash,
      duration: prev?.duration,
      cached: prev?.cached,
      stage: prev?.stage,
      error: detail.error,
    }));
  }
}
</script>

<PlayerLayout
  elementName={data.elementName}
  packageName={data.packageName}
  bind:controller={$controller}
  capabilities={data.capabilities}
  preloadController={playerType === 'esm'}
  preloadAuthor={false}
  preloadPrint={false}
  {debug}
>
  {#snippet children()}
    {#if syncing}
      <div class="sync-indicator">
        <span class="spinner-small"></span>
        Synchronizing...
      </div>
    {/if}
    <pie-element-theme-daisyui theme={$theme}>
      <div class="author-view" class:iife-author-player={playerType === 'iife'}>
        <div class="configure-container">
          <pie-element-player
            strategy={playerType}
            view="author"
            element-name={data.elementName}
            package-name={data.packageName}
            element-version={(data as LayoutData & { elementVersion?: string }).elementVersion || 'latest'}
            model={$model}
            rebuildVersion={$iifeBuildRequestVersion}
            onmodel-changed={handleModelChanged}
            onbundle-meta={handleBundleMeta}
            onbuild-state={handleBuildState}
          ></pie-element-player>
        </div>
      </div>
    </pie-element-theme-daisyui>
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

  .author-view {
    height: 100%;
    overflow: auto;
  }

  .configure-container {
    padding: 1rem;
    height: 100%;
  }
</style>
