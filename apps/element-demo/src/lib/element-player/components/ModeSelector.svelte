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

<div class="flex flex-col gap-2">
  <a
    href={getModeUrl('gather')}
    class="btn btn-sm justify-start"
    class:btn-primary={mode === 'gather'}
    class:btn-outline={mode !== 'gather'}
    data-sveltekit-reload
  >
    Gather
  </a>

  <a
    href={getModeUrl('view')}
    class="btn btn-sm justify-start"
    class:btn-primary={mode === 'view'}
    class:btn-outline={mode !== 'view'}
    data-sveltekit-reload
  >
    View
  </a>

  <a
    href={getModeUrl('evaluate')}
    class="btn btn-sm justify-start"
    class:btn-primary={mode === 'evaluate'}
    class:btn-outline={mode !== 'evaluate'}
    class:btn-disabled={evaluateDisabled}
    aria-disabled={evaluateDisabled}
    tabindex={evaluateDisabled ? -1 : 0}
    data-sveltekit-reload
  >
    Evaluate
  </a>
</div>
