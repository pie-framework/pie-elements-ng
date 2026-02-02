<script lang="ts">
/**
 * Mode Selector Component
 * Allows switching between gather/view/evaluate modes
 */

import { page } from '$app/stores';

let {
  mode = $bindable('gather'),
  evaluateDisabled = false,
}: {
  mode?: 'gather' | 'view' | 'evaluate';
  evaluateDisabled?: boolean;
} = $props();

// Build URL for mode change, preserving other params
function getModeUrl(newMode: 'gather' | 'view' | 'evaluate'): string {
  const url = new URL($page.url);
  url.searchParams.set('mode', newMode);
  return url.pathname + url.search;
}
</script>

<div class="mode-selector">
  <a
    href={getModeUrl('gather')}
    class="mode-link"
    class:active={mode === 'gather'}
    data-sveltekit-reload
  >
    <span>Gather</span>
  </a>

  <a
    href={getModeUrl('view')}
    class="mode-link"
    class:active={mode === 'view'}
    data-sveltekit-reload
  >
    <span>View</span>
  </a>

  <a
    href={getModeUrl('evaluate')}
    class="mode-link"
    class:active={mode === 'evaluate'}
    class:disabled={evaluateDisabled}
    aria-disabled={evaluateDisabled}
    tabindex={evaluateDisabled ? -1 : 0}
    data-sveltekit-reload
  >
    <span>Evaluate</span>
  </a>
</div>

<style>
  .mode-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mode-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .mode-link:hover:not(.disabled) {
    background: #f5f5f5;
  }

  .mode-link.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  .mode-link.active {
    background: #e3f2fd;
    border-color: #0066cc;
  }

  span {
    font-weight: 500;
    user-select: none;
  }
</style>
