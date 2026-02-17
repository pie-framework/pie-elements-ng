<script lang="ts">
/**
 * Delivery Player Layout Component
 *
 * Extended layout with mode/role/session/model controls for delivery view.
 */
import { onMount } from 'svelte';
import { page } from '$app/stores';
import ModeSelector from './ModeSelector.svelte';
import SessionPanel from './SessionPanel.svelte';
import ScoringPanel from './ScoringPanel.svelte';
import ModelPanel from './ModelPanel.svelte';
import { loadController } from '../lib/demo-element-loader';
import type { PieController } from '../lib/types';
import type { PlayerType } from '$lib/config/player-runtime';

// Props
let {
  elementName = '',
  model = {},
  session = {},
  mode = $bindable('gather'),
  playerRole = $bindable('student'),
  playerType = 'esm',
  partialScoring = $bindable(true),
  controller = $bindable<PieController | null>(null),
  capabilities = undefined,
  debug = false,
  children,
}: {
  elementName: string;
  model: any;
  session: any;
  mode?: 'gather' | 'view' | 'evaluate';
  playerRole?: 'student' | 'instructor';
  playerType?: PlayerType;
  partialScoring?: boolean;
  controller?: PieController | null;
  capabilities?: string[];
  debug?: boolean;
  children?: any;
} = $props();

// State
let loading = $state(true);
let error = $state<string | null>(null);
let score = $state<any>(null);
let controllerWarning = $state<string | null>(null);
let roleLocked = $state(false);
let splitRatio = $state(50);

// Effects
$effect(() => {
  roleLocked = mode === 'evaluate';
  if (playerRole !== 'instructor' && mode === 'evaluate') {
    mode = 'view';
  }
});

// Call controller in evaluate mode
$effect(() => {
  if (mode === 'evaluate' && controller && model && session) {
    if (debug) console.log('[delivery-player-layout] Calling controller.score()');

    const scoreMethod = controller.score || controller.outcome;

    if (scoreMethod) {
      scoreMethod(model, session, { mode, role: playerRole, partialScoring })
        .then((result: any) => {
          score = result;
          if (debug) console.log('[delivery-player-layout] Score result:', result);
        })
        .catch((err: any) => {
          console.error('[delivery-player-layout] Scoring error:', err);
          if (debug) score = { error: err.message };
        });
    } else {
      console.warn('[delivery-player-layout] Controller has no score or outcome method');
    }
  } else {
    score = null;
  }
});

onMount(async () => {
  try {
    if (!elementName) {
      throw new Error('element-name is required');
    }

    const packageName = `@pie-element/${elementName}`;

    if (debug) console.log(`[delivery-player-layout] Loading element: ${elementName}`);

    // For ESM mode, load controller from local modules if not provided.
    // In IIFE mode, controller is supplied by the IIFE bundle loader.
    if (playerType === 'esm' && !controller) {
      try {
        const ctrl = await loadController(packageName, '', debug);
        controller = ctrl;
      } catch (e) {
        controllerWarning = `Controller not available for "${elementName}".`;
        console.warn(`[delivery-player-layout] Controller not available for ${elementName}`);
      }
    }

    loading = false;
    if (debug) console.log('[delivery-player-layout] ✓ Element player initialized');
  } catch (err: any) {
    error = err.message;
    loading = false;
    console.error('[delivery-player-layout] Error initializing:', err);
  }
});

function handleSplitPointerDown(event: PointerEvent) {
  const container = (event.currentTarget as HTMLElement)?.parentElement;
  if (!container) return;

  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);

  const startX = event.clientX;
  const startRatio = splitRatio;
  const rect = container.getBoundingClientRect();

  const onMove = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientX - startX;
    const next = ((startRatio / 100) * rect.width + delta) / rect.width;
    splitRatio = Math.min(80, Math.max(20, Math.round(next * 100)));
  };

  const onUp = () => {
    target.releasePointerCapture(event.pointerId);
    document.body.style.cursor = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  document.body.style.cursor = 'col-resize';
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

function handleModelApply(nextModel: any) {
  // Model updates are handled by the store in parent routes
  console.log('[delivery-player-layout] Model apply requested:', nextModel);
}

// Build URL for role change, preserving other params
function getRoleUrl(newRole: 'student' | 'instructor'): string {
  const url = new URL($page.url);
  url.searchParams.set('role', newRole);
  return url.pathname + url.search;
}
</script>

<div class="layout-container">
  {#if loading}
    <div class="flex flex-col items-center justify-center p-12 text-base-content/60">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-4">Loading {elementName}...</p>
    </div>
  {:else if error}
    <div class="alert alert-error m-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    </div>
  {:else}
    {#if controllerWarning}
      <div class="alert alert-warning mx-4 mt-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{controllerWarning}</span>
      </div>
    {/if}

    <div class="player-content" style={`grid-template-columns: ${splitRatio}% 12px ${100 - splitRatio}%`}>
      <main class="min-w-0 pr-3 overflow-auto">
        {@render children?.()}
      </main>

      <div class="divider divider-horizontal cursor-col-resize" onpointerdown={handleSplitPointerDown} role="separator" aria-orientation="vertical"></div>

      <aside class="min-w-0 pl-3 overflow-auto space-y-4">
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <h3 class="card-title text-sm uppercase text-base-content/60">Mode</h3>
            <ModeSelector bind:mode evaluateDisabled={playerRole !== 'instructor'} />
          </div>
        </div>

        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <h3 class="card-title text-sm uppercase text-base-content/60">Role</h3>
            <div class="flex flex-col gap-2">
              <a
                href={getRoleUrl('student')}
                data-sveltekit-reload
                class="btn btn-sm justify-start"
                class:btn-primary={playerRole === 'student'}
                class:btn-outline={playerRole !== 'student'}
                class:btn-disabled={roleLocked}
                aria-disabled={roleLocked}
                tabindex={roleLocked ? -1 : 0}
                data-testid="role-student"
              >
                Student
              </a>
              <a
                href={getRoleUrl('instructor')}
                data-sveltekit-reload
                class="btn btn-sm justify-start"
                class:btn-primary={playerRole === 'instructor'}
                class:btn-outline={playerRole !== 'instructor'}
                data-testid="role-instructor"
              >
                Instructor
              </a>
            </div>
          </div>
        </div>

        <SessionPanel {session} />

        <ScoringPanel {score} />
      </aside>
    </div>
  {/if}
</div>

<style>
  .layout-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .player-content {
    display: grid;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .player-content > main,
  .player-content > aside {
    min-height: 0; /* Allow grid children to shrink below content size */
  }

  /* Responsive */
  @media (max-width: 900px) {
    .player-content {
      grid-template-columns: 1fr !important;
    }

    .divider-horizontal {
      display: none;
    }
  }
</style>
