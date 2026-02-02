<script lang="ts">
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
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
  </div>

  <!-- Main Content -->
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- Welcome Section -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4">Welcome to PIE Elements</h1>
        <p class="text-lg opacity-70 max-w-2xl mx-auto">
          Explore {data.elements.length} interactive assessment elements. Click on any element below to
          see it in action with live demos and configuration options.
        </p>
      </div>

      <!-- Element Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.elements as element}
          <a
            href="/{element.name}"
            class="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow duration-200"
          >
            <div class="card-body">
              <h2 class="card-title">
                {element.title}
                {#if element.demoCount > 1}
                  <span class="badge badge-primary badge-sm">{element.demoCount} demos</span>
                {/if}
              </h2>
              <p class="text-sm opacity-70">{element.packageName}</p>

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
