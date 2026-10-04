<script lang="ts">
import { onMount } from 'svelte';
import '@pie-element/element-player';
import '$lib/element-player/configure-loader';
import { theme } from '$lib/stores/demo-state';
import { loadController } from '$lib/element-player/lib/demo-element-loader';
import type { PieController } from '$lib/element-player/lib/types';
import { RENDER_TIMEOUT_MS, type RenderOutcome, watchRender } from './render-readiness';
import type { A11yScanMode, A11yScanRole } from './suite';

let {
  elementName,
  packageName,
  elementVersion = 'latest',
  model = {},
  session = {},
  mode = 'gather',
  role = 'student',
}: {
  elementName: string;
  packageName: string;
  elementVersion?: string;
  model?: unknown;
  session?: unknown;
  mode?: A11yScanMode;
  role?: A11yScanRole;
} = $props();

let controller = $state<PieController | null>(null);
let elementModel = $state<any>(null);
let elementSession = $state<any>({});
let loading = $state(true);
let modelReady = $state(false);
let error = $state<string | null>(null);
let buildRequestId = 0;

/**
 * The scan runs once the element has rendered its delivery DOM. The view model is ready earlier:
 * the player still has to load the element, and the element renders after it is mounted.
 */
let renderState = $state<'pending' | RenderOutcome>('pending');
let renderIssue = $state<string | null>(null);
let renderDeadline = 0;
let stopRenderWatch: (() => void) | null = null;
const renderTimeoutSeconds = RENDER_TIMEOUT_MS / 1000;

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

/**
 * The `updateSession` a controller calls during `model()`. It writes onto the session the view
 * model is built from, as a player's does, and leaves component state alone: reading
 * `elementSession` here would make the build effect depend on the state the build writes, and
 * the effect would re-run without end.
 */
function sessionWriter(target: Record<string, unknown>) {
  return (_id: string, _element: string, properties: Record<string, unknown>) => {
    if (properties && typeof properties === 'object') {
      Object.assign(target, properties);
    }
    return Promise.resolve();
  };
}

async function buildViewModel(requestId: number) {
  if (!controller?.model) {
    return;
  }

  modelReady = false;
  error = null;

  try {
    const sessionForController = cloneValue(normalizeSession(session));
    const nextModel = await (controller.model as any)(
      cloneValue(model),
      sessionForController,
      { mode, role, partialScoring: true },
      sessionWriter(sessionForController)
    );

    if (requestId !== buildRequestId) {
      return;
    }

    if (!nextModel || typeof nextModel !== 'object') {
      throw new Error('Controller model() must return an object model');
    }

    elementModel = { ...nextModel, mode };
    elementSession = cloneValue(sessionForController);
    modelReady = true;
  } catch (err) {
    if (requestId !== buildRequestId) {
      return;
    }
    error = err instanceof Error ? err.message : String(err);
    modelReady = false;
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

function markNotRendered(issue: string) {
  stopRenderWatch?.();
  stopRenderWatch = null;
  renderState = 'not-rendered';
  renderIssue = issue;
}

$effect(() => {
  if (!modelReady) {
    return;
  }
  renderState = 'pending';
  renderIssue = null;
  renderDeadline = Date.now() + RENDER_TIMEOUT_MS;
  const loadDeadline = setTimeout(() => {
    if (renderState === 'pending' && !stopRenderWatch) {
      markNotRendered(
        `Not rendered: ${elementName} did not load within ${renderTimeoutSeconds} s.`
      );
    }
  }, RENDER_TIMEOUT_MS);

  return () => {
    clearTimeout(loadDeadline);
    stopRenderWatch?.();
    stopRenderWatch = null;
  };
});

function handleLoadComplete(event: CustomEvent<{ tagName?: string }>) {
  const player = event.currentTarget as HTMLElement;
  const tagName = event.detail?.tagName;
  const instance = tagName ? player.getElementsByTagName(tagName)[0] : undefined;
  if (!instance) {
    markNotRendered(`Not rendered: the player mounted no ${tagName ?? elementName} element.`);
    return;
  }
  stopRenderWatch?.();
  stopRenderWatch = watchRender(
    instance,
    (outcome) => {
      stopRenderWatch = null;
      if (outcome === 'rendered') {
        renderState = 'rendered';
      } else {
        markNotRendered(
          `Not rendered: ${elementName} rendered no delivery DOM within ${renderTimeoutSeconds} s.`
        );
      }
    },
    { timeoutMs: Math.max(0, renderDeadline - Date.now()) }
  );
}

function handlePlayerError(event: CustomEvent<{ error?: string }>) {
  markNotRendered(`Not rendered: the player failed: ${event.detail?.error ?? 'unknown error'}`);
}

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
  data-a11y-ready={modelReady && !error && renderState === 'rendered' ? 'true' : 'false'}
  data-a11y-render={error ? 'not-rendered' : renderState}
  data-a11y-render-issue={error ?? renderIssue ?? undefined}
  data-a11y-loading={loading ? 'true' : 'false'}
  data-element={elementName}
  data-mode={mode}
  data-role={role}
>
  {#if loading}
    <div class="a11y-scan-status" data-testid="a11y-scan-status">Loading controller...</div>
  {:else if error}
    <div class="a11y-scan-error" data-testid="a11y-scan-error">{error}</div>
  {:else if !modelReady}
    <div class="a11y-scan-status" data-testid="a11y-scan-status">Preparing view model...</div>
  {:else}
    <pie-element-theme-daisyui theme={$theme}>
      <main
        class="a11y-scan-subject"
        data-testid="a11y-scan-subject"
        aria-label="{elementName} accessibility scan subject"
      >
        <pie-element-player
          strategy="esm"
          runtime-support-check="on"
          view="delivery"
          element-name={elementName}
          package-name={packageName}
          element-version={elementVersion}
          model={elementModel}
          session={elementSession}
          onsession-changed={handleSessionChanged}
          onload-complete={handleLoadComplete}
          onplayer-error={handlePlayerError}
        ></pie-element-player>
      </main>
      {#if renderIssue}
        <div class="a11y-scan-status" data-testid="a11y-scan-render-issue">{renderIssue}</div>
      {/if}
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
