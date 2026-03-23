<script lang="ts">
/**
 * Delivery Route
 * Shows the rendered PIE element for interaction
 */
import { page } from '$app/stores';
import DeliveryPlayerLayout from '$lib/element-player/components/DeliveryPlayerLayout.svelte';
import { parsePlayerType, type PlayerType } from '$lib/config/player-runtime';
import { get } from 'svelte/store';
import '@pie-element/element-player/players';
import {
  model,
  session,
  mode,
  role,
  partialScoring,
  controller,
  capabilities,
  updateSession,
  modelVersion,
  iifeBuildMeta,
  iifeBuildLoading,
  iifeBuildRequestVersion,
  theme,
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

// Build element model from controller
let elementModel = $state<any>(null);
let elementSession = $state<any>({});
let modelError = $state<string | null>(null);
let esmModelReady = $state(false);
let modelRequestId = 0;
const debug = false;
const playerType = $derived<PlayerType>(parsePlayerType($page.url.searchParams.get('player')));

// Normalize session - ensure it's an object without imposing specific structure
const normalizeSession = (nextSession: any) => {
  return nextSession && typeof nextSession === 'object' ? nextSession : {};
};

// Apply session update callback for controller
const applySessionUpdate = (patch: Record<string, unknown> | null | undefined) => {
  if (!patch || typeof patch !== 'object') {
    return Promise.resolve(get(session));
  }

  const baseSession = normalizeSession(get(session));
  const hasChanges = Object.entries(patch).some(
    ([key, value]) => (baseSession as Record<string, unknown>)[key] !== value
  );
  if (!hasChanges) {
    return Promise.resolve(get(session));
  }

  const nextSession = { ...(baseSession as Record<string, unknown>), ...patch };
  updateSession(nextSession);
  return Promise.resolve(get(session));
};

// Build the view model using the controller
const buildModel = async (
  requestId: number,
  currentModel: any,
  currentSession: any,
  currentMode: string,
  currentRole: string,
  currentPartialScoring: boolean,
  currentController: any,
  currentPlayerType: PlayerType
) => {
  if (debug)
    console.log('[deliver] Building model...', { requestId, mode: currentMode, role: currentRole });

  if (requestId === modelRequestId) {
    esmModelReady = false;
  }

  if (!currentModel) {
    elementModel = null;
    esmModelReady = false;
    modelError = 'No model configuration found';
    console.error('[deliver] No model provided');
    return;
  }

  const modelFn = currentController?.model;
  if (!modelFn || typeof modelFn !== 'function') {
    modelError = currentController
      ? 'Controller model() function is required but not found'
      : 'Controller not loaded yet';
    elementModel = null;
    esmModelReady = false;
    if (currentController) {
      console.error('[deliver] Controller missing model() function');
    }
    return;
  }

  try {
    // Pass session as-is to controller - each element knows its own session structure
    // Don't normalize to {value: []} as different elements use different structures
    // (e.g., graphing-solution-set uses {answer: []})
    // IMPORTANT: Create a copy so we can detect if controller modifies it
    const sessionForController = JSON.parse(JSON.stringify(currentSession || {}));

    const nextModel = await modelFn(
      currentModel,
      sessionForController,
      { mode: currentMode, role: currentRole, partialScoring: currentPartialScoring },
      applySessionUpdate
    );

    if (requestId === modelRequestId) {
      if (!nextModel || typeof nextModel !== 'object') {
        throw new Error('Controller model() must return an object model');
      }
      elementModel = { ...nextModel, mode: currentMode };
      elementSession = sessionForController; // Use controller-modified session
      esmModelReady = true;

      // If controller modified the session (e.g., initialized answer array), update the store
      // This ensures the session panel shows the initialized session
      const sessionChanged =
        JSON.stringify(sessionForController) !== JSON.stringify(currentSession);
      if (sessionChanged) {
        updateSession(sessionForController);
      }

      modelError = null;
      if (debug) {
        console.log('[deliver] Model built successfully');
      }
    }
  } catch (err) {
    console.error('[deliver] Controller model error:', err);
    if (requestId === modelRequestId) {
      modelError = err instanceof Error ? err.message : 'Failed to build model';
      elementModel = null;
      esmModelReady = false;
    }
  }
};

// Rebuild model when dependencies change
// Note: Session changes do NOT trigger rebuild - they're handled by pie-element-player events
// Only rebuild when model, mode, role, partialScoring, or controller changes
$effect(() => {
  const currentModel = $model;
  // DON'T track currentSession here - we'll get it inside buildModel
  // Tracking it here causes the effect to re-run when session changes
  const currentMode = $mode;
  const currentRole = $role;
  const currentPartialScoring = $partialScoring;
  const currentController = $controller;
  const currentPlayerType = playerType;
  const currentModelVersion = $modelVersion;
  // Explicitly NOT including sessionVersion - session updates should not trigger model rebuild

  if (debug) {
    console.log('[deliver] Effect triggered, modelVersion:', currentModelVersion);
  }

  modelRequestId += 1;
  const requestId = modelRequestId;

  // Get current session value without tracking it in the effect
  buildModel(
    requestId,
    currentModel,
    get(session), // Read store imperatively; session changes should not retrigger model rebuild
    currentMode,
    currentRole,
    currentPartialScoring,
    currentController,
    currentPlayerType
  );
});

// Handle session changes from the element
function handleSessionChanged(event: CustomEvent) {
  const detail = event.detail as any;
  const newSession = detail?.session ?? detail;
  elementSession = newSession;
  updateSession(newSession);
}

function handleIifeControllerChanged(event: CustomEvent) {
  if (playerType !== 'iife') {
    return;
  }
  const detail = event.detail as any;
  const nextController = detail?.controller ?? detail;
  if (nextController) {
    controller.set(nextController);
  }
}

function handleBundleMeta(event: CustomEvent) {
  iifeBuildMeta.set({ ...(event.detail || {}), stage: 'completed', error: null });
}

function handleBuildState(event: CustomEvent) {
  const detail = (event.detail || {}) as {
    loading?: boolean;
    error?: string | null;
    stage?: string;
  };
  iifeBuildLoading.set(!!detail.loading);
  if (detail.stage) {
    iifeBuildMeta.update((prev) => ({
      source: prev?.source ?? 'local',
      url: prev?.url ?? '',
      hash: prev?.hash,
      duration: prev?.duration,
      cached: prev?.cached,
      stage: detail.stage,
      error: prev?.error ?? null,
    }));
  }
  if (detail.error) {
    iifeBuildMeta.update((prev) => ({
      source: prev?.source ?? 'local',
      url: prev?.url ?? '',
      hash: prev?.hash,
      duration: prev?.duration,
      cached: prev?.cached,
      stage: prev?.stage,
      error: detail.error,
    }));
  }
}
</script>

<DeliveryPlayerLayout
  elementName={data.elementName}
  model={$model}
  session={$session}
  {playerType}
  bind:mode={$mode}
  bind:playerRole={$role}
  bind:partialScoring={$partialScoring}
  bind:controller={$controller}
  capabilities={$capabilities}
  {debug}
>
  {#snippet children()}
    <pie-element-theme-daisyui theme={$theme}>
      <div class="delivery-view">
        <div class="element-container">
          <pie-element-player
            strategy={playerType}
            view="delivery"
            element-name={data.elementName}
            package-name={data.packageName}
            element-version={(data as LayoutData & { elementVersion?: string }).elementVersion || 'latest'}
            model={esmModelReady ? elementModel : undefined}
            session={esmModelReady ? elementSession : undefined}
            rebuildVersion={$iifeBuildRequestVersion}
            onsession-changed={handleSessionChanged}
            oncontroller-changed={handleIifeControllerChanged}
            onbundle-meta={handleBundleMeta}
            onbuild-state={handleBuildState}
          ></pie-element-player>
          {#if !esmModelReady}
            <div class="model-error">{modelError ?? 'Preparing view model...'}</div>
          {/if}
        </div>
      </div>
    </pie-element-theme-daisyui>
  {/snippet}
</DeliveryPlayerLayout>

<style>
  .model-error {
    margin: 1rem;
    padding: 0.75rem 1rem;
    background: #fff8e1;
    border: 1px solid #f1c232;
    border-radius: 4px;
    color: #8a6d3b;
    font-size: 0.9rem;
  }

  .delivery-view {
    height: 100%;
    max-height: 100%;
    overflow: auto;
  }

  .element-container {
    padding: 1rem;
    max-width: 100%;
  }
</style>
