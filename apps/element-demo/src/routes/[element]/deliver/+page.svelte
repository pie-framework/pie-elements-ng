<script lang="ts">
/**
 * Delivery Route
 * Shows the rendered PIE element for interaction
 */
import { onMount } from 'svelte';
import DeliveryPlayerLayout from '$lib/element-player/components/DeliveryPlayerLayout.svelte';
import DeliveryView from '$lib/element-player/components/DeliveryView.svelte';
import {
  elementName,
  model,
  session,
  mode,
  role,
  partialScoring,
  controller,
  capabilities,
  mathRenderer,
  updateSession,
  modelVersion,
  sessionVersion,
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

// Build element model from controller
let elementModel = $state<any>({});
let modelError = $state<string | null>(null);
let modelRequestId = 0;
const debug = false;

// Normalize session
const normalizeSession = (nextSession: any) => {
  const normalized = nextSession && typeof nextSession === 'object' ? nextSession : {};
  if ((normalized as any).value === undefined) {
    (normalized as any).value = [];
  }
  return normalized;
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
    modelError = null;
    return;
  }

  const modelFn = currentController?.model;
  if (!modelFn || typeof modelFn !== 'function') {
    elementModel = { ...currentModel, mode: currentMode };
    modelError = currentController ? 'Controller model() required' : null;
    return;
  }

  try {
    const modelSession = normalizeSession(currentSession);
    const nextModel = await modelFn(
      currentModel,
      modelSession,
      { mode: currentMode, role: currentRole, partialScoring: currentPartialScoring },
      applySessionUpdate
    );

    if (requestId === modelRequestId) {
      elementModel = { ...nextModel, mode: currentMode };
      modelError = null;
      if (debug) console.log('[deliver] Model built successfully');
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
  const currentSession = $session;
  const currentMode = $mode;
  const currentRole = $role;
  const currentPartialScoring = $partialScoring;
  const currentController = $controller;
  const currentModelVersion = $modelVersion;
  // Explicitly NOT including sessionVersion - session updates should not trigger model rebuild

  modelRequestId += 1;
  const requestId = modelRequestId;

  buildModel(
    requestId,
    currentModel,
    currentSession,
    currentMode,
    currentRole,
    currentPartialScoring,
    currentController
  );
});

// Handle session changes from the element
function handleSessionChanged(event: CustomEvent) {
  updateSession(event.detail);
}
</script>

<DeliveryPlayerLayout
  elementName={$elementName}
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
      elementName={$elementName}
      {elementModel}
      bind:session={$session}
      mathRenderer={$mathRenderer}
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
