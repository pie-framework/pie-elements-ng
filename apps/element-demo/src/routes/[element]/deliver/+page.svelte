<script lang="ts">
/**
 * Delivery Route
 * Shows the rendered PIE element for interaction
 */
import { onMount } from 'svelte';
import DeliveryPlayerLayout from '$lib/element-player/components/DeliveryPlayerLayout.svelte';
import DeliveryView from '$lib/element-player/components/DeliveryView.svelte';
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
  sessionVersion,
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

// Build element model from controller
let elementModel = $state<any>({});
let elementSession = $state<any>({});
let modelError = $state<string | null>(null);
let modelRequestId = 0;
const debug = false;

// Normalize session - ensure it's an object without imposing specific structure
const normalizeSession = (nextSession: any) => {
  return nextSession && typeof nextSession === 'object' ? nextSession : {};
};

// Apply session update callback for controller
const applySessionUpdate = (patch: Record<string, unknown> | null | undefined) => {
  if (!patch || typeof patch !== 'object') {
    return Promise.resolve($session);
  }

  const baseSession = normalizeSession($session);
  const hasChanges = Object.entries(patch).some(
    ([key, value]) => (baseSession as Record<string, unknown>)[key] !== value
  );
  if (!hasChanges) {
    return Promise.resolve($session);
  }

  const nextSession = { ...(baseSession as Record<string, unknown>), ...patch };
  updateSession(nextSession);
  return Promise.resolve($session);
};

// Build the view model using the controller
const buildModel = async (
  requestId: number,
  currentModel: any,
  currentSession: any,
  currentMode: string,
  currentRole: string,
  currentPartialScoring: boolean,
  currentController: any
) => {
  if (debug)
    console.log('[deliver] Building model...', { requestId, mode: currentMode, role: currentRole });

  if (!currentModel) {
    elementModel = {};
    modelError = 'No model configuration found';
    console.error('[deliver] No model provided');
    return;
  }

  const modelFn = currentController?.model;
  if (!modelFn || typeof modelFn !== 'function') {
    elementModel = { ...currentModel, mode: currentMode };
    modelError = currentController
      ? 'Controller model() function is required but not found'
      : 'Controller not loaded yet';
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
      elementModel = { ...nextModel, mode: currentMode };
      elementSession = sessionForController; // Use controller-modified session

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
      elementModel = { ...currentModel, mode: currentMode };
      modelError = err instanceof Error ? err.message : 'Failed to build model';
    }
  }
};

// Rebuild model when dependencies change
// Note: Session changes do NOT trigger rebuild - they're handled by DeliveryView
// Only rebuild when model, mode, role, partialScoring, or controller changes
$effect(() => {
  const currentModel = $model;
  // DON'T track currentSession here - we'll get it inside buildModel
  // Tracking it here causes the effect to re-run when session changes
  const currentMode = $mode;
  const currentRole = $role;
  const currentPartialScoring = $partialScoring;
  const currentController = $controller;
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
    $session, // Read directly, don't track in effect
    currentMode,
    currentRole,
    currentPartialScoring,
    currentController
  );
});

// Handle session changes from the element
function handleSessionChanged(event: CustomEvent) {
  const newSession = event.detail;
  elementSession = newSession;
  updateSession(newSession);
}
</script>

<DeliveryPlayerLayout
  elementName={data.elementName}
  model={$model}
  session={$session}
  bind:mode={$mode}
  bind:playerRole={$role}
  bind:partialScoring={$partialScoring}
  bind:controller={$controller}
  capabilities={$capabilities}
  {debug}
>
  {#snippet children()}
    <DeliveryView
      elementName={data.elementName}
      {elementModel}
      session={elementSession}
      {debug}
      on:session-changed={handleSessionChanged}
    />
    {#if modelError}
      <div class="model-error">{modelError}</div>
    {/if}
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
</style>
