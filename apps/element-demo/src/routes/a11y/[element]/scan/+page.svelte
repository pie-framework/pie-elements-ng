<script lang="ts">
import A11yRunControls from '$lib/a11y/A11yRunControls.svelte';
import A11yScanPlayer from '$lib/a11y/A11yScanPlayer.svelte';
import { wcagUnderstandingUrl } from '$lib/a11y/wcag';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

const scanTitle = $derived(`${data.element.title} / ${data.activeDemo.title} / ${data.mode}`);
const scanStateDescription = $derived(
  data.mode === 'evaluate' ? 'Evaluate mode as instructor/scorer' : 'Gather mode as student'
);
const humanDemoId = $derived(data.activeScenario?.sourceDemoId ?? data.activeDemo.id);
const coverageLabel = $derived(
  data.scanSource === 'scenario' ? 'Scenario purpose' : 'Demo scenario'
);
</script>

<svelte:head>
  <title>{scanTitle} - PIE A11y Scan</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <header class="bg-base-100 border-b border-base-300 px-4 py-3">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <a
          href="/a11y"
          class="link link-primary text-sm"
          data-sveltekit-reload
          target="_blank"
          rel="noreferrer"
        >
          A11y inventory
        </a>
        <h1 class="text-xl font-bold mt-1">{data.element.title}</h1>
        <p class="text-sm text-base-content/70">
          {data.activeDemo.title} · {data.mode} · {data.role} · {data.player}
        </p>
        <div class="mt-3 max-w-3xl rounded-lg bg-base-200 border border-base-300 p-3 text-sm">
          <div class="flex items-start gap-2">
            <div class="flex-1">
              <p class="font-semibold">{coverageLabel}: {data.coverage.summary}</p>
              {#if data.coverage.facts.length > 0}
                <div class="flex flex-wrap gap-1 mt-2">
                  {#each data.coverage.facts as fact}
                    <span class="badge badge-sm badge-outline">{fact}</span>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="dropdown dropdown-end">
              <button
                type="button"
                tabindex="0"
                class="btn btn-xs btn-circle btn-outline"
                aria-label="About Axe scan coverage"
              >
                i
              </button>
              <div
                tabindex="0"
                class="dropdown-content z-10 card card-compact w-80 bg-base-100 shadow border border-base-300"
              >
                <div class="card-body text-sm font-normal text-base-content">
                  <p>
                    Axe runs against the mounted assessment element area only. It checks automated
                    WCAG 2.x/ARIA rules and records findings for reports; it does not validate
                    complete keyboard workflows or screen-reader usability.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
            <div>
              <dt class="font-semibold">Scan state</dt>
              <dd>{scanStateDescription}</dd>
            </div>
            <div>
              <dt class="font-semibold">Demo ID</dt>
              <dd>{data.activeDemo.id}</dd>
            </div>
            {#if data.activeScenario?.sourceDemoTitle}
              <div>
                <dt class="font-semibold">Fixture source</dt>
                <dd>{data.activeScenario.sourceDemoTitle}</dd>
              </div>
            {/if}
            <div>
              <dt class="font-semibold">Package</dt>
              <dd>{data.element.packageName}</dd>
            </div>
            {#if data.activeScenario?.wcagCriteria?.length}
              <div class="sm:col-span-2">
                <dt class="font-semibold">WCAG criteria</dt>
                <dd>
                  {#each data.activeScenario.wcagCriteria as criterion, index}
                    {#if index > 0}, {/if}<a
                      class="link link-primary"
                      href={wcagUnderstandingUrl(criterion)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {criterion}
                    </a>
                  {/each}
                </dd>
              </div>
            {/if}
            {#if data.activeScenario?.manualReviewNotes?.length}
              <div class="sm:col-span-2">
                <dt class="font-semibold">Manual follow-up</dt>
                <dd>{data.activeScenario.manualReviewNotes.join(' ')}</dd>
              </div>
            {/if}
          </dl>
        </div>
      </div>
      <div class="flex flex-col gap-3 min-w-72">
        <a
          class="btn btn-sm btn-outline"
          href="/{data.element.name}/deliver?demo={encodeURIComponent(humanDemoId)}&mode={data.mode}&role={data.role}&player={data.player}"
          data-sveltekit-reload
          target="_blank"
          rel="noreferrer"
        >
          Open Human Demo
        </a>
        {#if data.activeScenario}
          <A11yRunControls
            scope="single-scenario"
            element={data.element.name}
            scenario={data.activeScenario.id}
            label="Run this scenario"
            help="Runs only this scenario and links to its filtered reports."
          />
        {/if}
      </div>
    </div>
  </header>

  <A11yScanPlayer
    elementName={data.element.name}
    packageName={data.element.packageName}
    elementVersion={data.elementVersion}
    model={data.activeDemo.model}
    session={data.activeDemo.session ?? {}}
    mode={data.mode}
    role={data.role}
    player={data.player}
  />
</div>
