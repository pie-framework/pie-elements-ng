<script lang="ts">
/**
 * Delivery Player Layout Component
 *
 * Extended layout with mode/role/session/model controls for delivery view.
 */
import { onMount } from 'svelte';
import ModeSelector from './ModeSelector.svelte';
import SessionPanel from './SessionPanel.svelte';
import ScoringPanel from './ScoringPanel.svelte';
import ModelPanel from './ModelPanel.svelte';
import { loadController } from '../lib/demo-element-loader';
import type { PieController } from '../lib/types';

// Props
let {
  elementName = '',
  model = {},
  session = {},
  mode = $bindable('gather'),
  playerRole = $bindable('student'),
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

    // Load controller if not provided
    if (!controller) {
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
</script>

{#if loading}
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading {elementName}...</p>
  </div>
{:else if error}
  <div class="error">
    <h3>⚠️ Error</h3>
    <p>{error}</p>
  </div>
{:else}
  {#if controllerWarning}
    <div class="warning">{controllerWarning}</div>
  {/if}

  <div class="player-content" style={`grid-template-columns: ${splitRatio}% 12px ${100 - splitRatio}%`}>
    <main>
      {@render children?.()}
    </main>

    <div class="splitter" onpointerdown={handleSplitPointerDown} role="separator" aria-orientation="vertical"></div>

    <aside class="controls">
      <div class="panel">
        <h3>Mode</h3>
        <ModeSelector bind:mode evaluateDisabled={playerRole !== 'instructor'} />
      </div>

      <div class="panel">
        <h3>Role</h3>
        <div class="role-selector">
          <label class:active={playerRole === 'student'} class:disabled={roleLocked}>
            <input
              type="radio"
              bind:group={playerRole}
              value="student"
              disabled={roleLocked}
            />
            <span>Student</span>
          </label>
          <label class:active={playerRole === 'instructor'}>
            <input type="radio" bind:group={playerRole} value="instructor" />
            <span>Instructor</span>
          </label>
        </div>
      </div>

      <SessionPanel {session} />

      <ScoringPanel {score} />

      <ModelPanel {model} onApply={handleModelApply} />
    </aside>
  </div>
{/if}

<style>
  .loading {
    padding: 3rem;
    text-align: center;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 1rem;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    padding: 2rem;
    margin: 1rem;
    background: #ffebee;
    border: 2px solid #d32f2f;
    border-radius: 4px;
    color: #c62828;
  }

  .error h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .error p {
    margin: 0;
  }

  .warning {
    margin: 0.75rem 1rem 1rem;
    padding: 0.75rem 1rem;
    background: #fff8e1;
    border: 1px solid #f1c232;
    border-radius: 4px;
    color: #8a6d3b;
    font-size: 0.9rem;
  }

  .player-content {
    display: grid;
    height: 100%;
    overflow: hidden;
  }

  main {
    min-width: 0;
    padding-right: 0.75rem;
    overflow: auto;
  }

  aside {
    min-width: 0;
    padding-left: 0.75rem;
    overflow: auto;
  }

  .splitter {
    width: 2px;
    cursor: col-resize;
    border-radius: 4px;
    background-color: #e5e7eb;
    align-self: stretch;
    z-index: 1;
    touch-action: none;
  }

  .splitter:hover {
    background-color: #cbd5e1;
  }

  .panel {
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .panel h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    color: #666;
    font-weight: 600;
  }

  .role-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .role-selector label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .role-selector label:hover {
    background: #f5f5f5;
  }

  .role-selector label.active {
    background: #e3f2fd;
    border-color: #0066cc;
  }

  .role-selector label.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .role-selector label.disabled:hover {
    background: transparent;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .player-content {
      grid-template-columns: 1fr !important;
    }

    .splitter {
      display: none;
    }

    aside {
      width: 100%;
    }
  }
</style>
