<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { loadIifePackage } from '../lib/iife-bundle-loader';
import {
  createMathRenderingObserver,
  renderMathInContainer,
} from '../lib/math-rendering-coordinator';

interface Props {
  elementName: string;
  packageName: string;
  elementVersion: string;
  model?: any;
  role?: 'student' | 'instructor';
  rebuildVersion?: number;
}

const dispatch = createEventDispatcher();

let {
  elementName,
  packageName,
  elementVersion,
  model = {},
  role = 'student',
  rebuildVersion = 0,
}: Props = $props();

let container: HTMLDivElement | null = null;
let printInstance = $state<HTMLElement | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let requestId = 0;
let mathObserver: MutationObserver | null = null;

function cloneModelForPrint<T>(value: T): T {
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

function getPrintTagName(name: string): string {
  return `${name}-print`;
}

async function loadPrintBundle() {
  const currentRequest = ++requestId;
  loading = true;
  error = null;
  dispatch('build-state', { loading: true, error: null });

  try {
    const { pkg, meta } = await loadIifePackage({
      packageName,
      version: elementVersion,
      bundleTarget: 'player',
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

    const PrintClass = pkg.Print;
    if (!PrintClass) {
      throw new Error(`No Print export found for ${packageName}`);
    }

    const printTag = getPrintTagName(elementName);
    if (!customElements.get(printTag)) {
      customElements.define(printTag, class extends PrintClass {});
    }
    await customElements.whenDefined(printTag);

    if (!printInstance) {
      printInstance = document.createElement(printTag);
    }
    (printInstance as any).model = cloneModelForPrint(model ?? {});
    (printInstance as any).role = role;

    if (container && printInstance.parentElement !== container) {
      container.innerHTML = '';
      container.appendChild(printInstance);
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
  if (!printInstance) {
    return;
  }
  (printInstance as any).model = cloneModelForPrint(model ?? {});
  (printInstance as any).role = role;
});

$effect(() => {
  if (container) {
    if (mathObserver) {
      mathObserver.disconnect();
    }
    renderMathInContainer(container);
    mathObserver = createMathRenderingObserver(container, { debounceMs: 150 });
    return () => {
      if (mathObserver) {
        mathObserver.disconnect();
        mathObserver = null;
      }
    };
  }
});

$effect(() => {
  if (!elementName || !packageName || !elementVersion) {
    return;
  }
  rebuildVersion;
  loadPrintBundle();
});
</script>

<div class="print-view" bind:this={container}>
  {#if loading}
    <div class="loading">Building/loading IIFE print bundle for {elementName}...</div>
  {/if}
  {#if error}
    <div class="error">
      <strong>IIFE print error:</strong>
      <pre>{error}</pre>
    </div>
  {/if}
</div>

<style>
  .print-view {
    height: 100%;
    overflow: auto;
    padding: 1rem;
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
