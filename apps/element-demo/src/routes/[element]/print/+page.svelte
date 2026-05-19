<script lang="ts">
/**
 * Print Route
 * Shows the print-friendly version of the element
 */
import PlayerLayout from '$lib/element-player/components/PlayerLayout.svelte';
import '$lib/element-player/configure-loader';
import { page } from '$app/stores';
import {
  iifeBundleEndpoint,
  iifeBundleHost,
  parsePlayerType,
  type PlayerType,
} from '$lib/config/player-runtime';
import '@pie-element/element-player';
import {
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
    <pie-element-theme-daisyui theme={$theme}>
      <div class="print-view">
        <pie-element-player
          strategy={playerType}
          runtime-support-check="on"
          view="print"
          element-name={data.elementName}
          package-name={data.packageName}
          element-version={(data as LayoutData & { elementVersion?: string }).elementVersion || 'latest'}
          iife-bundle-endpoint={iifeBundleEndpoint}
          iife-bundle-host={iifeBundleHost}
          model={$model}
          role={$role}
          rebuildVersion={$iifeBuildRequestVersion}
          onbundle-meta={handleBundleMeta}
          onbuild-state={handleBuildState}
        ></pie-element-player>
      </div>
    </pie-element-theme-daisyui>
  {/snippet}
</PlayerLayout>

<style>
  .print-view {
    height: 100%;
    overflow: auto;
    padding: 1rem;
  }
</style>
