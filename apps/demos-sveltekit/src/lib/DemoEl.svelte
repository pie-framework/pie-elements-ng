<script lang="ts">
import { defineCustomElements } from '@pslb/demo-el/dist/loader/index.mjs';
import { onDestroy, onMount } from 'svelte';
import type { DemoModule } from './demo-registry';

export let demo: DemoModule;

let host: HTMLDivElement | null = null;
let de: HTMLElement | null = null;
let demoElReady: Promise<void> | null = null;

onMount(() => {
  if (!host) return;

  demoElReady ??= defineCustomElements(window).then(() => undefined);

  // demo-el is a custom element. We create one instance per demo.
  demoElReady.then(() => {
    if (!host) return;
    de = document.createElement('demo-el');
    host.appendChild(de);

    // The demo-el element expects these runtime-set properties.
    // @ts-expect-error - demo-el is a custom element with runtime API
    de.def = demo.def;
    // @ts-expect-error - demo-el is a custom element with runtime API
    de.model = demo.model;
    if ('session' in demo) {
      // @ts-expect-error - demo-el is a custom element with runtime API
      de.session = demo.session ?? null;
    }
  });
});

onDestroy(() => {
  if (de && host) {
    host.removeChild(de);
  }
  de = null;
});
</script>

<div bind:this={host}></div>

