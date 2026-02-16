<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { loadIifePackage } from '../lib/iife-bundle-loader';
import AuthorView from './AuthorView.svelte';

interface Props {
  elementName: string;
  packageName: string;
  elementVersion: string;
  model?: any;
  rebuildVersion?: number;
}

const dispatch = createEventDispatcher();

let { elementName, packageName, elementVersion, model = {}, rebuildVersion = 0 }: Props = $props();

let loading = $state(false);
let error = $state<string | null>(null);
let ready = $state(false);
let requestId = 0;

function getConfigureTagName(name: string): string {
  return `${name}-configure`;
}

async function loadAuthorBundle() {
  const currentRequest = ++requestId;
  loading = true;
  ready = false;
  error = null;
  dispatch('build-state', { loading: true, error: null });

  try {
    const { pkg, meta } = await loadIifePackage({
      packageName,
      version: elementVersion,
      bundleTarget: 'editor',
      forceRebuild: rebuildVersion > 0,
      clearCache: rebuildVersion > 0,
      onProgress: ({ stage, message }) => {
        dispatch('build-state', { loading: true, stage, message, error: null });
      },
    });

    if (currentRequest !== requestId) {
      return;
    }

    dispatch('bundle-meta', meta);

    if (pkg.controller) {
      dispatch('controller-changed', pkg.controller);
    }

    if (!pkg.Configure) {
      throw new Error(`No Configure export found for ${packageName}`);
    }

    const configureTag = getConfigureTagName(elementName);
    if (!customElements.get(configureTag)) {
      customElements.define(configureTag, class extends pkg.Configure {});
    }
    await customElements.whenDefined(configureTag);
    ready = true;
  } catch (err: any) {
    if (currentRequest !== requestId) {
      return;
    }
    error = err?.message || String(err);
  } finally {
    if (currentRequest === requestId) {
      loading = false;
      dispatch('build-state', { loading: false, error });
    }
  }
}

function handleModelChanged(event: CustomEvent) {
  dispatch('model-changed', event.detail);
}

$effect(() => {
  if (!elementName || !packageName || !elementVersion) {
    return;
  }
  rebuildVersion;
  loadAuthorBundle();
});
</script>

<div class="iife-author-player">
  {#if loading}
    <div class="loading">Building/loading IIFE editor bundle for {elementName}...</div>
  {/if}
  {#if error}
    <div class="error">
      <strong>IIFE author error:</strong>
      <pre>{error}</pre>
    </div>
  {/if}
  {#if ready && !error}
    <AuthorView {elementName} {model} on:model-changed={handleModelChanged} />
  {/if}
</div>

<style>
  .iife-author-player {
    width: 100%;
    min-height: 100px;
  }

  .loading {
    padding: 2rem;
    text-align: center;
    color: hsl(var(--bc) / 0.6);
    font-style: italic;
  }

  .error {
    padding: 1rem;
    background: hsl(var(--er) / 0.1);
    border: 1px solid hsl(var(--er) / 0.3);
    border-radius: 4px;
    color: hsl(var(--er));
  }

  .error pre {
    margin: 0.5rem 0 0;
    padding: 0.5rem;
    background: #fff;
    border-radius: 4px;
    font-size: 0.875rem;
    overflow-x: auto;
  }
</style>
