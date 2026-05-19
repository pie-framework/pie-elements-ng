<script lang="ts">
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>PIE A11y Inventory Baseline</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <a
        href="/a11y"
        class="btn btn-ghost gap-3"
        data-sveltekit-reload
        target="_blank"
        rel="noreferrer"
      >
        <img src="/pie-logo-orange.svg" alt="PIE Logo" class="w-10 h-10" />
        <span class="font-bold text-xl">PIE A11y Inventory Baseline</span>
      </a>
    </div>
  </div>

  <main class="container mx-auto px-6 py-8 max-w-screen-2xl">
    <section class="mb-8">
      <h1 class="text-4xl font-bold mb-3">Broad Demo Inventory</h1>
      <p class="max-w-3xl text-base-content/70">
        This baseline shadows the current demo samples and is useful for broad discovery. The
        primary `/a11y` suite uses dedicated scenarios with explicit WCAG concerns.
      </p>
      <div class="stats shadow mt-6">
        <div class="stat">
          <div class="stat-title">Elements</div>
          <div class="stat-value">{data.totalElements}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Scan Targets</div>
          <div class="stat-value">{data.totalScanTargets}</div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {#each data.inventory as element}
        <article class="card bg-base-100 shadow">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="card-title">{element.title}</h2>
                <p class="text-sm text-base-content/60">{element.packageName}</p>
              </div>
              <span class="badge badge-primary">{element.demos.length} demos</span>
            </div>

            <div class="overflow-x-auto mt-3">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Demo sample</th>
                    <th>Gather</th>
                    <th>Evaluate</th>
                  </tr>
                </thead>
                <tbody>
                  {#each element.demos as demo}
                    <tr>
                      <td>
                        <div class="font-medium">{demo.title}</div>
                        <div class="text-xs text-base-content/60">{demo.id}</div>
                      </td>
                      <td>
                        <a
                          class="link link-primary"
                          href="/a11y/{element.name}/scan?demo={encodeURIComponent(demo.id)}&mode=gather"
                          data-sveltekit-reload
                          target="_blank"
                          rel="noreferrer"
                        >
                          scan
                        </a>
                      </td>
                      <td>
                        <a
                          class="link link-primary"
                          href="/a11y/{element.name}/scan?demo={encodeURIComponent(demo.id)}&mode=evaluate"
                          data-sveltekit-reload
                          target="_blank"
                          rel="noreferrer"
                        >
                          scan
                        </a>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      {/each}
    </section>
  </main>
</div>
