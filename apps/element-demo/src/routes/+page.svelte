<script lang="ts">
  import { onMount } from "svelte";

  // Get element info
  const elementName = import.meta.env.VITE_ELEMENT_NAME || "multiple-choice";
  const packageName = `@pie-element/${elementName}`;

  // Format element name for display
  function formatElementName(name: string): string {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // State
  let elementInfo = $state<any>(null);
  let loading = $state(false);
  let packageVersion = $state<string>("");
  let hasAuthor = $state(false);
  let hasPrint = $state(false);

  onMount(async () => {
    try {
      // Load element registry
      const registry = await import("$lib/elements/registry");
      const info = registry.getElement(elementName);

      if (info) {
        elementInfo = info;
        hasAuthor = info.hasAuthor;
        hasPrint = info.hasPrint;
      }

      // Try to load package.json to get version
      try {
        const pkgModule = await import(
          `@pie-element/${elementName}/package.json`
        );
        packageVersion = pkgModule.version || "";
      } catch (e) {
        // Version not available
        console.log("Could not load package version");
      }
    } catch (e) {
      console.error("Error loading element info:", e);
    }
  });
</script>

<div class="hero min-h-screen bg-gradient-to-br from-primary to-secondary">
  <div class="hero-content text-center">
    <div class="max-w-2xl card bg-base-100 shadow-2xl p-8">
      <img
        src="/pie-logo-orange.svg"
        alt="PIE Logo"
        class="w-20 h-20 mx-auto mb-4"
      />

      {#if loading}
        <span class="loading loading-spinner loading-lg text-primary"></span>
      {:else}
        <h1 class="text-5xl font-bold mb-6">
          {formatElementName(elementName)}
        </h1>

        <div class="card bg-base-200 mb-6">
          <div class="card-body p-6 gap-3">
            <div class="flex justify-between items-center">
              <span class="font-semibold text-base-content/70">Package:</span>
              <code class="badge badge-lg badge-outline font-mono">
                {packageName}
              </code>
            </div>

            {#if packageVersion}
              <div class="flex justify-between items-center">
                <span class="font-semibold text-base-content/70">Version:</span>
                <code class="badge badge-lg badge-outline font-mono">
                  {packageVersion}
                </code>
              </div>
            {/if}

            {#if elementInfo}
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
            {/if}
          </div>
        </div>

        <div class="flex flex-col gap-4 mb-6">
          <a href="/player/deliver" class="btn btn-primary btn-lg gap-2">
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
            <a href="/player/deliver" class="link link-primary">Delivery</a>
            {#if hasAuthor}
              <span class="text-base-content/40">•</span>
              <a href="/player/author" class="link link-primary">Author</a>
            {/if}
            {#if hasPrint}
              <span class="text-base-content/40">•</span>
              <a href="/player/print" class="link link-primary">Print</a>
            {/if}
            <span class="text-base-content/40">•</span>
            <a href="/player/source" class="link link-primary">Source</a>
          </div>
        </div>

        <p class="text-base-content/70">
          This is the PIE element demo application. Use the player to interact
          with the element in different modes (delivery, authoring, print) and
          inspect its internal model and session state.
        </p>
      {/if}
    </div>
  </div>
</div>
