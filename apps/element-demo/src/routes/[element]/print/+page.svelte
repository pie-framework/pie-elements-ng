<script lang="ts">
/**
 * Print Route
 * Shows the print-friendly version of the element
 */
import PlayerLayout from '$lib/element-player/components/PlayerLayout.svelte';
import PrintView from '$lib/element-player/components/PrintView.svelte';
import IifePrintPlayer from '$lib/element-player/components/IifePrintPlayer.svelte';
import { page } from '$app/stores';
import { parsePlayerType, type PlayerType } from '$lib/config/player-runtime';
import {
  elementName,
  model,
  role,
  controller,
  iifeBuildMeta,
  iifeBuildLoading,
  iifeBuildRequestVersion,
  theme,
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

const debug = false;
const playerType = $derived<PlayerType>(parsePlayerType($page.url.searchParams.get('player')));

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

{#if playerType === 'iife'}
  <div class="h-full overflow-auto p-4">
    <pie-element-theme-daisyui theme={$theme}>
      <IifePrintPlayer
        elementName={data.elementName}
        packageName={data.packageName}
        elementVersion={(data as LayoutData & { elementVersion?: string }).elementVersion || 'latest'}
        model={$model}
        role={$role}
        rebuildVersion={$iifeBuildRequestVersion}
        on:bundle-meta={handleBundleMeta}
        on:build-state={handleBuildState}
      />
    </pie-element-theme-daisyui>
  </div>
{:else}
  <PlayerLayout
    elementName={data.elementName}
    packageName={data.packageName}
    bind:controller={$controller}
    capabilities={data.capabilities}
    {debug}
  >
    {#snippet children()}
      <pie-element-theme-daisyui theme={$theme}>
        <PrintView
          elementName={$elementName}
          model={$model}
          role={$role}
          {debug}
        />
      </pie-element-theme-daisyui>
    {/snippet}
  </PlayerLayout>
{/if}
