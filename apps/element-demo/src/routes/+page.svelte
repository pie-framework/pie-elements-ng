<script lang="ts">
import type { PageData } from './$types';
import { theme } from '$lib/stores/demo-state';

let { data }: { data: PageData } = $props();

// Filter state
let filterText = $state('');

// Filtered elements based on search
const filteredElements = $derived(
  data.elements.filter((element) => {
    if (!filterText.trim()) return true;
    const searchLower = filterText.toLowerCase();
    return (
      element.name.toLowerCase().includes(searchLower) ||
      element.title.toLowerCase().includes(searchLower) ||
      element.packageName.toLowerCase().includes(searchLower)
    );
  })
);

// Handle theme toggle checkbox
function handleThemeToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const newTheme = checkbox.checked ? 'dark' : 'light';
  theme.set(newTheme);
}
</script>

<div class="min-h-screen bg-base-200">
  <!-- Header -->
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <div class="flex items-center gap-3 px-4">
        <img src="/pie-logo-orange.svg" alt="PIE Logo" class="w-10 h-10" />
        <div class="flex flex-col">
          <span class="font-bold text-xl">PIE Elements Demo</span>
          <span class="text-xs opacity-70">Interactive Assessment Components</span>
        </div>
      </div>
    </div>
    <div class="navbar-end">
      <label class="swap swap-rotate">
        <input
          type="checkbox"
          class="theme-controller"
          value="dark"
          checked={$theme === 'dark'}
          onchange={handleThemeToggle}
        />
        <svg class="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1-.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
        <svg class="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>
      </label>
    </div>
  </div>

  <!-- Main Content -->
  <div class="container mx-auto px-6 py-8 max-w-full">
    <div class="max-w-screen-2xl mx-auto">
      <!-- Welcome Section -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4">Welcome to PIE Elements</h1>
        <p class="text-lg opacity-70 max-w-2xl mx-auto">
          Explore {data.elements.length} interactive assessment elements. Click on any element below to
          see it in action with live demos and configuration options.
        </p>
      </div>

      <!-- Filter Section -->
      <div class="mb-8 max-w-2xl mx-auto">
        <div class="form-control">
          <div class="input-group flex">
            <input
              type="text"
              placeholder="Filter elements by name..."
              class="input input-bordered flex-1"
              bind:value={filterText}
              data-testid="element-filter"
            />
            {#if filterText}
              <button
                class="btn btn-square"
                onclick={() => (filterText = '')}
                aria-label="Clear filter"
                data-testid="clear-filter"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
          </div>
          {#if filterText && filteredElements.length === 0}
            <div class="text-center mt-4 text-sm opacity-70">
              No elements found matching "{filterText}"
            </div>
          {:else if filterText}
            <div class="text-center mt-2 text-sm opacity-70">
              Showing {filteredElements.length} of {data.elements.length} elements
            </div>
          {/if}
        </div>
      </div>

      <!-- Element Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each filteredElements as element}
          <a
            href="/{element.name}"
            class="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow duration-200"
          >
            <div class="card-body">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h2 class="card-title flex-1 min-w-0">
                  <span class="break-words">{element.title}</span>
                </h2>
                {#if element.demoCount >= 1}
                  <span class="badge badge-primary badge-sm flex-shrink-0 whitespace-nowrap">{element.demoCount} {element.demoCount === 1 ? 'demo' : 'demos'}</span>
                {/if}
              </div>
              <p class="text-sm opacity-70 truncate">{element.packageName}</p>

              <!-- Features -->
              <div class="flex gap-2 mt-2 flex-wrap">
                {#if element.hasAuthor}
                  <span class="badge badge-sm badge-outline">Author</span>
                {/if}
                {#if element.hasPrint}
                  <span class="badge badge-sm badge-outline">Print</span>
                {/if}
              </div>

              <div class="card-actions justify-end mt-4">
                <button class="btn btn-primary btn-sm">View Demos</button>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>
