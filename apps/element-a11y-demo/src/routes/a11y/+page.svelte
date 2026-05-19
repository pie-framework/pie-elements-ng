<script lang="ts">
import A11yRunControls from '$lib/a11y/A11yRunControls.svelte';
import { wcagUnderstandingUrl } from '$lib/a11y/wcag';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>PIE A11y Scan Suite</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <a href="/" class="btn btn-ghost gap-3" target="_blank" rel="noreferrer">
        <img src="/pie-logo-orange.svg" alt="PIE Logo" class="w-10 h-10" />
        <span class="font-bold text-xl">PIE A11y Scan Suite</span>
      </a>
    </div>
  </div>

  <main class="container mx-auto px-6 py-8 max-w-screen-2xl">
    <section class="mb-8">
      <h1 class="text-4xl font-bold mb-3">Accessibility Scenario Suite</h1>
      <p class="max-w-3xl text-base-content/70">
        Dedicated WCAG 2.2 AA-oriented scenarios exercise specific accessibility concerns for
        each PIE element. Axe and lightweight Playwright checks record findings without making
        builds fail yet.
      </p>
      <div class="mt-4">
        <a
          href="/a11y/inventory"
          class="link link-primary"
          data-sveltekit-reload
          target="_blank"
          rel="noreferrer"
        >
          Open broad demo inventory baseline
        </a>
      </div>
      <div class="stats shadow mt-6">
        <div class="stat">
          <div class="stat-title">Elements</div>
          <div class="stat-value">{data.totalElements}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Covered Elements</div>
          <div class="stat-value">{data.coveredElements}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Scenarios</div>
          <div class="stat-value">{data.totalScanTargets}</div>
        </div>
      </div>
      <div class="mt-6 max-w-3xl">
        <A11yRunControls
          scope="full-scenarios"
          label="Run full a11y suite"
          help="Runs all curated scenarios locally and links to the generated JSON, Markdown, and HTML reports."
        />
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {#each data.inventory as element}
        <article class="card bg-base-100 shadow">
          <div class="card-body">
            <div>
              <h2 class="card-title">{element.title}</h2>
              <p class="text-sm text-base-content/60">{element.packageName}</p>
            </div>

            <div class="overflow-x-auto mt-3">
              <table class="table table-sm scenario-table">
                <thead>
                  <tr>
                    <th class="align-top">Scenario</th>
                    <th class="align-top">Mode</th>
                    <th class="align-top">Concerns</th>
                  </tr>
                </thead>
                <tbody>
                  {#each element.scenarios as scenario}
                    <tr>
                      <td class="align-top">
                        <a
                          class="link link-primary"
                          href="/a11y/{element.name}/scan?scenario={encodeURIComponent(scenario.id)}"
                          data-sveltekit-reload
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span class="font-medium block">{scenario.title}</span>
                        </a>
                      </td>
                      <td class="align-top">{scenario.mode}</td>
                      <td class="align-top">
                        <div class="text-sm leading-relaxed">{scenario.concerns.join(', ')}</div>
                        <div class="text-xs text-base-content/60 mt-2 leading-relaxed">
                          WCAG
                          {#each scenario.wcagCriteria as criterion, index}
                            {#if index > 0}, {/if}<a
                              class="link link-primary underline"
                              href={wcagUnderstandingUrl(criterion)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {criterion}
                            </a>
                          {/each}
                        </div>
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

<style>
  .scenario-table :global(th),
  .scenario-table :global(td) {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
</style>
