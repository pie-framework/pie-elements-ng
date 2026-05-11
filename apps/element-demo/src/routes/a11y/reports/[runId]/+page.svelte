<script lang="ts">
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

const title = $derived(
  data.reportType === 'inventory' ? 'A11y Inventory Report' : 'A11y Scenario Report'
);
const findings = $derived(data.records.filter((record: any) => record.status !== 'passed'));

function elementLabel(record: any) {
  return `${record.element?.title ?? record.element?.name ?? 'Unknown element'}${
    record.element?.name ? ` (${record.element.name})` : ''
  }`;
}

function targetTitle(record: any) {
  return record.scenario?.title ?? record.demo?.title ?? 'Scan target';
}

function targetPurpose(record: any) {
  return record.scenario?.purpose ?? record.demo?.description;
}

function wcagCriteria(record: any) {
  return record.scenario?.wcagCriteria?.join(', ');
}

function concerns(record: any) {
  return record.scenario?.concerns?.join(', ');
}
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <main class="container mx-auto px-6 py-8 max-w-screen-xl">
    <section class="mb-8">
      <p class="text-sm text-base-content/60 mb-2">
        Generated {data.summary.generatedAt}
      </p>
      <h1 class="text-4xl font-bold">{title}</h1>
      <p class="text-base-content/70 mt-3 max-w-3xl">
        Formatted local report for the latest completed a11y run. Findings are non-blocking
        until the suite is explicitly configured to enforce them.
      </p>

      <div class="stats shadow mt-6">
        {#if data.reportType === 'inventory'}
          <div class="stat">
            <div class="stat-title">Targets</div>
            <div class="stat-value">{data.summary.totals.targets}</div>
          </div>
          <div class="stat">
            <div class="stat-title">With Violations</div>
            <div class="stat-value">{data.summary.totals.targetsWithViolations}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Axe Violations</div>
            <div class="stat-value">{data.summary.totals.axeViolations}</div>
          </div>
        {:else}
          <div class="stat">
            <div class="stat-title">Scenarios</div>
            <div class="stat-value">{data.summary.totals.scenarios}</div>
          </div>
          <div class="stat">
            <div class="stat-title">With Findings</div>
            <div class="stat-value">{data.summary.totals.scenariosWithFindings}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Axe Violations</div>
            <div class="stat-value">{data.summary.totals.axeViolations}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Check Failures</div>
            <div class="stat-value">{data.summary.totals.automatedCheckFailures}</div>
          </div>
        {/if}
      </div>

      <div class="mt-4 flex flex-wrap gap-3 text-sm">
        {#each data.rawLinks as link}
          <a class="link link-primary underline" href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        {/each}
      </div>
    </section>

    <section class="card bg-base-100 shadow mb-8">
      <div class="card-body">
        <h2 class="card-title">Element Summary</h2>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Element</th>
                <th>Passed</th>
                <th>{data.reportType === 'inventory' ? 'Violations' : 'Findings'}</th>
                <th>Errors</th>
                {#if data.reportType === 'scenarios'}
                  <th>Concerns</th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each Object.entries(data.summary.byElement) as [elementName, elementSummary]}
                <tr>
                  <td>
                    <div class="font-medium">{(elementSummary as any).title}</div>
                    <div class="text-xs text-base-content/50">{elementName}</div>
                  </td>
                  <td>{(elementSummary as any).passed}</td>
                  <td>
                    {data.reportType === 'inventory'
                      ? (elementSummary as any).violations
                      : (elementSummary as any).findings}
                  </td>
                  <td>{(elementSummary as any).error}</td>
                  {#if data.reportType === 'scenarios'}
                    <td class="text-sm">
                      {data.summary.coverageMatrix?.[elementName]?.join(', ') ?? ''}
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">Findings</h2>

      {#if findings.length === 0}
        <div class="alert alert-success">No Axe violations, automated check failures, or harness errors were recorded.</div>
      {:else}
        <div class="space-y-4">
          {#each findings as record}
            <article class="card bg-base-100 shadow">
              <div class="card-body">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 class="card-title">{targetTitle(record)}</h3>
                    <p class="text-sm text-base-content/60">{elementLabel(record)}</p>
                  </div>
                  <span class="badge badge-warning">{record.status}</span>
                </div>

                {#if targetPurpose(record)}
                  <p class="text-sm mt-2">{targetPurpose(record)}</p>
                {/if}

                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                  <div>
                    <dt class="font-semibold">Route</dt>
                    <dd><code>{record.route}</code></dd>
                  </div>
                  {#if wcagCriteria(record)}
                    <div>
                      <dt class="font-semibold">WCAG</dt>
                      <dd>{wcagCriteria(record)}</dd>
                    </div>
                  {/if}
                  {#if concerns(record)}
                    <div>
                      <dt class="font-semibold">Concerns</dt>
                      <dd>{concerns(record)}</dd>
                    </div>
                  {/if}
                  <div>
                    <dt class="font-semibold">Suggested Ticket Scope</dt>
                    <dd><code>[a11y][{record.element.name}] {targetTitle(record)}</code></dd>
                  </div>
                </dl>

                {#if record.error}
                  <div class="alert alert-error mt-4 py-2 text-sm">{record.error}</div>
                {/if}

                {#if record.checks?.some((check: any) => check.status === 'failed')}
                  <div class="mt-4">
                    <h4 class="font-semibold mb-2">Automated Check Failures</h4>
                    <div class="space-y-2">
                      {#each record.checks.filter((check: any) => check.status === 'failed') as check}
                        <div class="rounded border border-base-300 bg-base-200 p-3 text-sm">
                          <div class="font-medium">{check.check}</div>
                          <div>{check.message}</div>
                          {#if check.details?.length}
                            <ul class="list-disc ml-5 mt-2">
                              {#each check.details as detail}
                                <li><code>{detail}</code></li>
                              {/each}
                            </ul>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if record.violations?.length}
                  <div class="mt-4">
                    <h4 class="font-semibold mb-2">Axe Violations</h4>
                    <div class="space-y-2">
                      {#each record.violations as violation}
                        <div class="rounded border border-base-300 bg-base-200 p-3 text-sm">
                          <div class="font-medium">
                            {violation.impact ?? 'unknown'}: {violation.help}
                            <code class="ml-1">{violation.id}</code>
                          </div>
                          <a
                            class="link link-primary underline"
                            href={violation.helpUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Axe rule details
                          </a>
                          <div class="text-xs text-base-content/60 mt-1">
                            Nodes: {violation.nodes.length}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </main>
</div>
