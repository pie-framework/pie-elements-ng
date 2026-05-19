<script lang="ts">
import { onDestroy } from 'svelte';
import type { A11yRunJobSnapshot, A11yRunRequest, A11yRunScope } from './run-types';

let {
  scope,
  element,
  scenario,
  label,
  help,
}: {
  scope: A11yRunScope;
  element?: string;
  scenario?: string;
  label: string;
  help?: string;
} = $props();

let job = $state<A11yRunJobSnapshot | null>(null);
let error = $state<string | null>(null);
let pollingTimeout: ReturnType<typeof setTimeout> | null = null;

const isRunning = $derived(job?.status === 'queued' || job?.status === 'running');
const isComplete = $derived(!!job && !isRunning);
const formattedReportLink = $derived(
  job?.reportLinks.find((link) => link.label === 'Formatted report')
);

function statusClass(status: A11yRunJobSnapshot['status']) {
  if (status === 'passed') {
    return 'badge-success';
  }
  if (status === 'findings') {
    return 'badge-warning';
  }
  if (status === 'failed') {
    return 'badge-error';
  }
  return 'badge-info';
}

async function startRun() {
  error = null;
  const payload: A11yRunRequest = {
    scope,
    element,
    scenario,
  };

  try {
    const response = await fetch('/a11y/api/runs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? 'Unable to start a11y run');
    }

    job = body as A11yRunJobSnapshot;
    schedulePoll(job.id);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
}

function schedulePoll(runId: string) {
  clearPoll();
  pollingTimeout = setTimeout(() => {
    void refreshRun(runId);
  }, 1000);
}

async function refreshRun(runId: string) {
  try {
    const response = await fetch(`/a11y/api/runs/${runId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? 'Unable to refresh a11y run');
    }

    job = body as A11yRunJobSnapshot;
    if (job.status === 'queued' || job.status === 'running') {
      schedulePoll(job.id);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    clearPoll();
  }
}

function clearPoll() {
  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
    pollingTimeout = null;
  }
}

onDestroy(clearPoll);
</script>

<div class="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <button class="btn btn-primary btn-sm" type="button" onclick={startRun} disabled={isRunning}>
        {isRunning ? 'Running...' : label}
      </button>
      {#if help}
        <p class="text-xs text-base-content/60 mt-2">{help}</p>
      {/if}
    </div>

    {#if job}
      <span class="badge {statusClass(job.status)}">{job.status}</span>
    {/if}
  </div>

  {#if error}
    <div class="alert alert-error mt-3 py-2 text-sm">{error}</div>
  {/if}

  {#if isComplete && formattedReportLink}
    <div class="mt-3">
      <a
        class="btn btn-sm btn-outline btn-primary"
        href={formattedReportLink.href}
        target="_blank"
        rel="noreferrer"
      >
        Open report
      </a>
    </div>
  {/if}

  {#if job?.status === 'failed' && job.outputTail}
    <pre class="mt-3 max-h-48 overflow-auto rounded bg-base-200 p-3 text-xs whitespace-pre-wrap">{job.outputTail}</pre>
  {/if}
</div>
