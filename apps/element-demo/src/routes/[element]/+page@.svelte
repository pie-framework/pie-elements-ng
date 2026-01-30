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

<div class="hero min-h-screen bg-gradient-to-br from-primary to-secondary">
  <div class="hero-content text-center">
    <div class="max-w-2xl card bg-base-100 shadow-2xl p-8">
      <img
        src="/pie-logo-orange.svg"
        alt="PIE Logo"
        class="w-20 h-20 mx-auto mb-4"
      />

      <h1 class="text-5xl font-bold mb-6">
        {data.elementTitle}
      </h1>

      <div class="card bg-base-200 mb-6">
        <div class="card-body p-6 gap-3">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-base-content/70">Package:</span>
            <code class="badge badge-lg badge-outline font-mono">
              {packageName}
            </code>
          </div>

          <div class="flex justify-between items-center">
            <span class="font-semibold text-base-content/70"
              >Capabilities:</span
            >
            <div class="flex gap-2 flex-wrap">
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
      </div>

      <div class="flex flex-col gap-4 mb-6">
        <a href="/{data.elementName}/deliver" class="btn btn-primary btn-lg gap-2">
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

        <div class="flex items-center justify-center gap-2 text-sm">
          <a href="/{data.elementName}/deliver" class="link link-primary">Delivery</a>
          {#if hasAuthor}
            <span class="text-base-content/40">•</span>
            <a href="/{data.elementName}/author" class="link link-primary">Author</a>
          {/if}
          {#if hasPrint}
            <span class="text-base-content/40">•</span>
            <a href="/{data.elementName}/print" class="link link-primary">Print</a>
          {/if}
          <span class="text-base-content/40">•</span>
          <a href="/{data.elementName}/source" class="link link-primary">Source</a>
        </div>
      </div>

      <p class="text-base-content/70">
        This is the PIE element demo application. Use the player to interact
        with the element in different modes (delivery, authoring, print) and
        inspect its internal model and session state.
      </p>

      <div class="mt-6">
        <a href="/" class="link link-neutral text-sm">← Back to Home</a>
      </div>
    </div>
  </div>
</div>
