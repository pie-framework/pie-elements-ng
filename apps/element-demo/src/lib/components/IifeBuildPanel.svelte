<script lang="ts">
import { iifeBuildLoading, iifeBuildMeta, requestIifeRebuild } from '$lib/stores/demo-state';
</script>

<div class="flex items-center gap-2 text-xs">
  {#if $iifeBuildLoading}
    <span class="badge badge-outline">
      {$iifeBuildMeta?.stage ? `${$iifeBuildMeta.stage}...` : 'building...'}
    </span>
  {/if}
  {#if $iifeBuildMeta?.duration !== undefined}
    <span class="badge badge-outline">{$iifeBuildMeta.duration}ms</span>
  {/if}
  {#if $iifeBuildMeta?.cached === true}
    <span class="badge badge-success">cache hit</span>
  {:else if $iifeBuildMeta?.cached === false}
    <span class="badge badge-warning">cache miss</span>
  {/if}
  {#if $iifeBuildMeta?.hash}
    <span class="badge badge-info">hash {$iifeBuildMeta.hash}</span>
  {/if}
  {#if $iifeBuildMeta?.error}
    <span class="badge badge-error">build failed</span>
  {/if}
  <button
    class="btn btn-xs"
    onclick={() => requestIifeRebuild()}
    disabled={$iifeBuildLoading}
    title="Clear local bundler cache and rebuild"
  >
    Rebuild (clean cache)
  </button>
</div>
