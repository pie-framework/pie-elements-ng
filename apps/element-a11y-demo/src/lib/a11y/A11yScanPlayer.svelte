<script lang="ts">
import { onMount } from 'svelte';
import '@pie-element/element-player';
import '$lib/element-player/configure-loader';
import { theme } from '$lib/stores/demo-state';
import { loadController } from '$lib/element-player/lib/demo-element-loader';
import type { PieController } from '$lib/element-player/lib/types';
import type { A11yScanMode, A11yScanRole } from './suite';

let {
  elementName,
  packageName,
  elementVersion = 'latest',
  model = {},
  session = {},
  mode = 'gather',
  role = 'student',
  player = 'esm',
}: {
  elementName: string;
  packageName: string;
  elementVersion?: string;
  model?: unknown;
  session?: unknown;
  mode?: A11yScanMode;
  role?: A11yScanRole;
  player?: 'esm' | 'iife';
} = $props();

let controller = $state<PieController | null>(null);
let elementModel = $state<any>(null);
let elementSession = $state<any>({});
let loading = $state(true);
let ready = $state(false);
let error = $state<string | null>(null);
let buildRequestId = 0;

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

function normalizeSession(nextSession: unknown): Record<string, unknown> {
  return nextSession && typeof nextSession === 'object'
    ? (nextSession as Record<string, unknown>)
    : {};
}

function applySessionUpdate(patch: Record<string, unknown> | null | undefined) {
  if (!patch || typeof patch !== 'object') {
    return Promise.resolve(elementSession);
  }
  elementSession = {
    ...normalizeSession(elementSession),
    ...patch,
  };
  return Promise.resolve(elementSession);
}

async function buildViewModel(requestId: number) {
  if (!controller?.model) {
    return;
  }

  ready = false;
  error = null;

  try {
    const sessionForController = cloneValue(normalizeSession(session));
    const nextModel = await (controller.model as any)(
      cloneValue(model),
      sessionForController,
      { mode, role, partialScoring: true },
      applySessionUpdate
    );

    if (requestId !== buildRequestId) {
      return;
    }

    if (!nextModel || typeof nextModel !== 'object') {
      throw new Error('Controller model() must return an object model');
    }

    elementModel = { ...nextModel, mode };
    elementSession = cloneValue(sessionForController);
    ready = true;
  } catch (err) {
    if (requestId !== buildRequestId) {
      return;
    }
    error = err instanceof Error ? err.message : String(err);
    ready = false;
  }
}

onMount(async () => {
  try {
    loading = true;
    error = null;
    controller = await loadController(packageName);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  } finally {
    loading = false;
  }
});

$effect(() => {
  if (!controller) {
    return;
  }
  buildRequestId += 1;
  void buildViewModel(buildRequestId);
});

function handleSessionChanged(event: CustomEvent) {
  const detail = event.detail;
  if (detail && typeof detail === 'object' && 'session' in detail) {
    elementSession = normalizeSession((detail as { session?: unknown }).session);
    return;
  }
  elementSession = normalizeSession(detail);
}
</script>

<div
  class="a11y-scan-root"
  data-testid="a11y-scan-root"
  data-a11y-ready={ready && !error ? 'true' : 'false'}
  data-a11y-loading={loading ? 'true' : 'false'}
  data-element={elementName}
  data-mode={mode}
  data-role={role}
>
  {#if loading}
    <div class="a11y-scan-status" data-testid="a11y-scan-status">Loading controller...</div>
  {:else if error}
    <div class="a11y-scan-error" data-testid="a11y-scan-error">{error}</div>
  {:else if !ready}
    <div class="a11y-scan-status" data-testid="a11y-scan-status">Preparing view model...</div>
  {:else}
    <pie-element-theme-daisyui theme={$theme}>
      <main
        class="a11y-scan-subject"
        data-testid="a11y-scan-subject"
        aria-label="{elementName} accessibility scan subject"
      >
        <pie-element-player
          strategy={player}
          runtime-support-check="on"
          view="delivery"
          element-name={elementName}
          package-name={packageName}
          element-version={elementVersion}
          model={elementModel}
          session={elementSession}
          onsession-changed={handleSessionChanged}
        ></pie-element-player>
      </main>
    </pie-element-theme-daisyui>
  {/if}
</div>

<style>
  .a11y-scan-root {
    min-height: 100%;
  }

  .a11y-scan-subject {
    padding: 1rem;
  }

  .a11y-scan-status,
  .a11y-scan-error {
    margin: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
  }

  .a11y-scan-status {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e3a8a;
  }

  .a11y-scan-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #7f1d1d;
  }
</style>
