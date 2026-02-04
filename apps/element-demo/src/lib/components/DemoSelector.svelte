<script lang="ts">
/**
 * Demo Selector Component
 * Dropdown to select from multiple demo configurations
 */
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import type { DemoConfig } from '$lib/stores/demo-state';

interface Props {
  demos: DemoConfig[];
  activeDemoId: string;
}

let { demos, activeDemoId }: Props = $props();

// Get the active demo ID from URL query parameter, falling back to the prop
const currentActiveDemoId = $derived($page.url.searchParams.get('demo') || activeDemoId);

// Get the active demo
const activeDemo = $derived(demos.find((d) => d.id === currentActiveDemoId) || demos[0]);

// Handle demo selection
function selectDemo(demoId: string) {
  // Close the dropdown by removing focus
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const url = new URL($page.url);
  url.searchParams.set('demo', demoId);
  // Force full page reload to load fresh demo data from server
  window.location.href = url.toString();
}
</script>

{#if demos.length >= 1}
  <div class="demo-selector dropdown" class:single-demo={demos.length === 1}>
    {#if demos.length > 1}
      <div tabindex="0" role="button" class="btn btn-sm btn-outline gap-2" data-testid="demo-selector-button">
        <!-- Icon -->
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        <!-- Active demo title -->
        <span class="max-w-[200px] truncate">{activeDemo?.title || 'Select Demo'}</span>

        <!-- Demo count badge -->
        <span class="badge badge-sm badge-primary">{demos.length}</span>

        <!-- Dropdown arrow -->
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    {:else}
      <div role="status" class="btn btn-sm btn-outline gap-2 cursor-default">
        <!-- Icon -->
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        <!-- Active demo title -->
        <span class="max-w-[200px] truncate">{activeDemo?.title || 'Select Demo'}</span>

        <!-- Demo count badge -->
        <span class="badge badge-sm badge-primary">{demos.length}</span>
      </div>
    {/if}

    <!-- Dropdown menu -->
    <ul
      class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-96 max-h-[80vh] overflow-y-auto mt-2"
      data-testid="demo-selector-dropdown"
    >
      {#each demos as demo (demo.id)}
        <li class="w-full">
          <button
            class="flex flex-col items-start gap-1 py-3 px-4 w-full"
            class:active={demo.id === currentActiveDemoId}
            onclick={() => selectDemo(demo.id)}
            type="button"
            data-demo-id={demo.id}
          >
            <!-- Demo title -->
            <div class="font-semibold text-sm">{demo.title}</div>

            <!-- Demo description -->
            <div class="text-xs opacity-70 whitespace-normal">{demo.description}</div>

            <!-- Tags -->
            {#if demo.tags && demo.tags.length > 0}
              <div class="flex gap-1 mt-1 flex-wrap">
                {#each demo.tags as tag}
                  <span class="badge badge-xs badge-outline">{tag}</span>
                {/each}
              </div>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .demo-selector :global(.dropdown-content) {
    /* Ensure dropdown appears above other content */
    z-index: 1000;
    /* Prevent clicks when not visible */
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
  }

  /* Show dropdown when button is focused/active (but not for single demo) */
  .demo-selector:focus-within :global(.dropdown-content) {
    pointer-events: auto;
    opacity: 1;
    visibility: visible;
  }

  /* Prevent dropdown from opening when there's only one demo */
  .demo-selector.single-demo :global(.dropdown-content) {
    display: none !important;
  }

  /* Make single demo button non-interactive */
  .demo-selector.single-demo .cursor-default {
    cursor: default !important;
    pointer-events: none;
  }

  .demo-selector :global(.menu) {
    /* Force vertical layout - no columns */
    display: flex !important;
    flex-direction: column !important;
  }

  .demo-selector :global(.menu li) {
    /* Ensure each list item takes full width */
    width: 100% !important;
    display: block !important;
  }

  .demo-selector :global(button.active) {
    background-color: hsl(var(--p) / 0.2);
  }
</style>
