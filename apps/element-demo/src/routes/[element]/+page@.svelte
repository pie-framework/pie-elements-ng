<script lang="ts">
/**
 * Element Landing Page
 * Shows overview and capabilities for a specific element
 */
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

// Format element name for display
function formatElementName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const packageName = $derived(`@pie-element/${data.elementName}`);
const hasAuthor = $derived(data.capabilities.includes('author'));
const hasPrint = $derived(data.capabilities.includes('print'));
</script>

<div class="min-h-screen bg-gradient-to-br from-primary to-secondary p-6">
  <div class="card bg-base-100 shadow-2xl">
      <!-- Header -->
      <div class="card-body p-8 pb-6 border-b border-base-300">
        <div class="flex items-center gap-6">
          <img
            src="/pie-logo-orange.svg"
            alt="PIE Logo"
            class="w-20 h-20 flex-shrink-0"
          />
          <div class="flex-1">
            <h1 class="text-4xl font-bold mb-2">
              {data.elementTitle}
            </h1>
            <code class="badge badge-lg badge-outline font-mono">
              {packageName}
            </code>
          </div>
          <div class="flex gap-2 flex-wrap justify-end">
            <span class="badge badge-primary">Delivery</span>
            {#if hasAuthor}
              <span class="badge badge-primary">Author</span>
            {/if}
            {#if hasPrint}
              <span class="badge badge-primary">Print</span>
            {/if}
            <span class="badge badge-primary">Source</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="card-body p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column: Actions -->
          <div class="space-y-6">
            <div>
              <a href="/{data.elementName}/deliver" data-sveltekit-reload class="btn btn-primary btn-lg btn-block gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Launch Player
              </a>

              <div class="flex items-center justify-center gap-2 text-sm mt-3">
                <a href="/{data.elementName}/deliver" data-sveltekit-reload class="link link-primary">Delivery</a>
                {#if hasAuthor}
                  <span class="text-base-content/40">•</span>
                  <a href="/{data.elementName}/author" data-sveltekit-reload class="link link-primary">Author</a>
                {/if}
                {#if hasPrint}
                  <span class="text-base-content/40">•</span>
                  <a href="/{data.elementName}/print" data-sveltekit-reload class="link link-primary">Print</a>
                {/if}
                <span class="text-base-content/40">•</span>
                <a href="/{data.elementName}/source" data-sveltekit-reload class="link link-primary">Source</a>
              </div>
            </div>

            <div class="card bg-base-200">
              <div class="card-body p-6">
                <p class="text-base-content/70 text-sm">
                  This is the PIE element demo application. Use the player to interact
                  with the element in different modes (delivery, authoring, print) and
                  inspect its internal model and session state.
                </p>
              </div>
            </div>

            <div>
              <a href="/" data-sveltekit-reload class="link link-neutral text-sm">← Back to Home</a>
            </div>
          </div>

          <!-- Right Column: Demos -->
          <div class="card bg-base-200">
            <div class="card-body p-6">
              <h2 class="card-title text-lg mb-3">
                Available Demos
                <span class="badge badge-primary">{data.demoCount}</span>
              </h2>
              <div class="space-y-2 max-h-[500px] overflow-y-auto">
                {#each data.demos ?? [] as demo}
                  <a
                    href="/{data.elementName}/deliver?demo={demo.id}"
                    data-sveltekit-reload
                    class="block p-3 rounded-lg hover:bg-base-300 transition-colors border border-base-300"
                  >
                    <div class="font-semibold text-sm">{demo.title}</div>
                    <div class="text-xs text-base-content/70 mt-1">
                      {demo.description}
                    </div>
                    {#if demo.tags && demo.tags.length > 0}
                      <div class="flex gap-1 mt-2 flex-wrap">
                        {#each demo.tags as tag}
                          <span class="badge badge-xs badge-outline">{tag}</span>
                        {/each}
                      </div>
                    {/if}
                  </a>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</div>
