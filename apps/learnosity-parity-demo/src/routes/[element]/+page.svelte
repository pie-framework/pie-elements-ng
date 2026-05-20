<script lang="ts">
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.elementTitle} Learnosity parity</title>
</svelte:head>

<div class="min-h-screen bg-base-200 p-6">
  <div class="mx-auto max-w-5xl space-y-6">
    <header class="card bg-base-100 shadow">
      <div class="card-body">
        <p class="text-sm uppercase tracking-wide text-base-content/60">Learnosity parity demo</p>
        <h1 class="card-title text-3xl">{data.elementTitle}</h1>
        <p class="text-base-content/70">
          Use this app for Learnosity replacement work that needs private signing credentials or
          side-by-side reference rendering. The public element demo intentionally excludes this
          server-dependent surface.
        </p>
      </div>
    </header>

    <section class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Available parity samples</h2>
        <div class="grid gap-3">
          {#each data.demos ?? [] as demo}
            <div class="rounded-lg border border-base-300 p-4">
              <div class="font-semibold">{demo.title}</div>
              <p class="mt-1 text-sm text-base-content/70">{demo.description}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <a class="btn btn-primary btn-sm" href="/{data.elementName}/deliver?demo={demo.id}">
                  Open PIE delivery
                </a>
                {#if demo.model?.source?.learnosityItemReference}
                  <a class="btn btn-outline btn-sm" href="/{data.elementName}/parity?demo={demo.id}">
                    Compare with Learnosity
                  </a>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>
  </div>
</div>
