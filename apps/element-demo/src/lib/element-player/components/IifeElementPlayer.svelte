<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { loadIifePackage, type LocalBundleMeta } from '../lib/iife-bundle-loader';

interface Props {
  elementName: string;
  packageName: string;
  elementVersion: string;
  model?: any;
  session?: any;
  rebuildVersion?: number;
}

const dispatch = createEventDispatcher();

let {
  elementName,
  packageName,
  elementVersion,
  model = {},
  session = {},
  rebuildVersion = 0,
}: Props = $props();

let container: HTMLElement;
let elementInstance = $state<HTMLElement | null>(null);
let currentTagName = $state<string | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let requestId = 0;

function cloneModelForElement<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      return value;
    }
  }
}

function getTagName(name: string): string {
  return `pie-iife-${name}`.replace(/[^a-z0-9-]/g, '-');
}

function bindSessionHandler(instance: HTMLElement) {
  instance.addEventListener('session-changed', (e: Event) => {
    e.stopPropagation();
    const detail = e as CustomEvent;
    const nextSession = (instance as any).session;
    dispatch('session-changed', {
      session: nextSession,
      complete: (detail.detail as any)?.complete,
      component: (detail.detail as any)?.component,
    });
  });
}

async function loadElement() {
  const currentRequest = ++requestId;
  loading = true;
  error = null;
  dispatch('build-state', { loading: true, error: null });

  try {
    const { pkg, meta } = await loadIifePackage({
      packageName,
      version: elementVersion,
      forceRebuild: rebuildVersion > 0,
      clearCache: rebuildVersion > 0,
      onProgress: ({ stage, message }) => {
        dispatch('build-state', { loading: true, stage, message, error: null });
      },
    });

    if (currentRequest !== requestId) {
      return;
    }

    dispatch('bundle-meta', meta as LocalBundleMeta);

    if (pkg.controller) {
      dispatch('controller-changed', pkg.controller);
    }

    const ElementClass = pkg.Element;
    if (!ElementClass) {
      throw new Error(`No Element export found for ${packageName}`);
    }

    const tagName = getTagName(elementName);
    if (!customElements.get(tagName)) {
      customElements.define(tagName, class extends ElementClass {});
    }
    await customElements.whenDefined(tagName);

    if (!elementInstance || currentTagName !== tagName) {
      if (elementInstance) {
        elementInstance.remove();
      }
      elementInstance = document.createElement(tagName);
      bindSessionHandler(elementInstance);
      currentTagName = tagName;
    }

    (elementInstance as any).model = cloneModelForElement(model ?? {});
    (elementInstance as any).session = session ?? {};

    if (container && elementInstance.parentElement !== container) {
      container.innerHTML = '';
      container.appendChild(elementInstance);
    }
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

$effect(() => {
  if (!elementName || !packageName || !elementVersion) {
    return;
  }
  rebuildVersion;
  loadElement();
});

$effect(() => {
  if (!elementInstance) {
    return;
  }
  (elementInstance as any).model = cloneModelForElement(model ?? {});
  (elementInstance as any).session = session ?? {};
});
</script>

<div bind:this={container} class="demo-element-player">
  {#if loading}
    <div class="loading">Building/loading IIFE bundle for {elementName}...</div>
  {/if}
  {#if error}
    <div class="error">
      <strong>IIFE player error:</strong>
      <pre>{error}</pre>
    </div>
  {/if}
</div>

<style>
  .demo-element-player {
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
