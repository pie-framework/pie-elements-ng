<script lang="ts">
  /**
   * Player Routes Layout
   * Initializes stores and provides common data to all player routes
   * Shows navbar and tab navigation for player views
   */
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
    initializeDemo,
    hasConfigure,
    hasPrint,
  } from "$lib/stores/demo-state";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: any } = $props();

  // Initialize stores only once on mount
  onMount(() => {
    if (data) {
      initializeDemo({
        elementName: data.elementName,
        elementTitle: data.elementTitle,
        model: data.initialModel,
        session: data.initialSession,
        controller: null, // Will be loaded by PlayerLayout
        capabilities: data.capabilities,
        mathRenderer: data.mathRenderer,
      });
    }
  });

  // Format element name for display
  function formatElementName(name: string): string {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Tab configuration
  const tabs = [
    { id: "deliver", label: "Delivery", path: "/player/deliver" },
    { id: "author", label: "Author", path: "/player/author" },
    { id: "print", label: "Print", path: "/player/print" },
    { id: "source", label: "Source", path: "/player/source" },
  ];

  // Determine active tab from current path (use $derived in Svelte 5)
  const activeTab = $derived($page.url.pathname.split("/")[2] || "deliver");
  const packageName = $derived(`@pie-element/${data.elementName}`);
</script>

<div class="app-container">
  <!-- Navbar -->
  <div class="navbar bg-base-100 shadow-lg">
    <div class="flex items-center gap-3 ml-4">
      <a href="/" class="flex items-center gap-3 no-underline">
        <img src="/pie-logo-orange.svg" alt="PIE Logo" class="w-10 h-10" />
        <div class="flex flex-col">
          <span class="text-xl font-bold"
            >{formatElementName(data.elementName)}</span
          >
          <span class="text-xs text-base-content/70">{packageName}</span>
        </div>
      </a>
    </div>
    <div class="mr-4">
      <label class="flex cursor-pointer gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path
            d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
          />
        </svg>
        <input type="checkbox" value="dark" class="toggle theme-controller" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </label>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="tabs-container">
    <div class="tabs">
      {#each tabs as tab}
        {@const isDisabled =
          (tab.id === "author" && !$hasConfigure) ||
          (tab.id === "print" && !$hasPrint)}
        <a
          href={tab.path}
          class="tab"
          class:active={activeTab === tab.id}
          class:disabled={isDisabled}
          aria-disabled={isDisabled}
          tabindex={isDisabled ? -1 : 0}
        >
          {tab.label}
        </a>
      {/each}
    </div>
  </div>

  <!-- Page Content -->
  <div class="page-content">
    {@render children()}
  </div>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    flex-shrink: 0;
  }

  .no-underline {
    text-decoration: none;
    color: inherit;
  }

  .tabs-container {
    background: white;
    border-bottom: 1px solid #ddd;
    flex-shrink: 0;
  }

  .tabs {
    display: flex;
    gap: 0;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .tab {
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    font-weight: 500;
    cursor: pointer;
  }

  .tab:hover:not(.disabled) {
    color: #0066cc;
    background: #f5f5f5;
  }

  .tab.active {
    color: #0066cc;
    border-bottom-color: #0066cc;
  }

  .tab.disabled {
    color: #ccc;
    cursor: not-allowed;
    pointer-events: none;
  }

  .page-content {
    flex: 1;
    overflow: auto;
    background: #f9fafb;
  }

  /* Dark mode support */
  :global([data-theme="dark"]) .tabs-container {
    background: #1a1a1a;
    border-bottom-color: #333;
  }

  :global([data-theme="dark"]) .tab {
    color: #aaa;
  }

  :global([data-theme="dark"]) .tab:hover:not(.disabled) {
    color: #66b3ff;
    background: #2a2a2a;
  }

  :global([data-theme="dark"]) .tab.active {
    color: #66b3ff;
    border-bottom-color: #66b3ff;
  }

  :global([data-theme="dark"]) .page-content {
    background: #0a0a0a;
  }
</style>
